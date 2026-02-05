import { BadRequestException } from "@/application/errors/bad-request-exception";
import { ConflictException } from "@/application/errors/conflict-exception";
import { NotFoundException } from "@/application/errors/not-found-exception";
import { left, right, type Either } from "@/core/either";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { IdempotencyKey } from "@/domain/entities/idempotency-key";
import { Notification } from "@/domain/entities/notification";
import { NotificationStatus } from "@/domain/enums/notification-status";
import { IdempotencyKeyRepository } from "@/domain/repositories/idempotency-key-repository";
import { NotificationRepository } from "@/domain/repositories/notification-repository";
import { UnitOfWork } from "@/domain/repositories/unit-of-work";
import { UserRepository } from "@/domain/repositories/user-repository";
import {
  idempotencyKeySchema,
  type CreateNotificationDto
} from "@/infra/http/dtos/create-notification.dto";
import { EventsService, MESSAGE_PATTERNS } from "@/infra/messaging";
import { Injectable } from "@nestjs/common";
import { addHours } from "date-fns";
import { z } from "zod";

interface CreateNotificationInput {
  input: CreateNotificationDto;
  rawHeader: any;
}

type CreateNotificationUseCaseResponse = Either<
  BadRequestException | ConflictException | NotFoundException,
  {
    notification: Notification;
  }
>;

type TxEither = Either<
  ConflictException,
  { notification: Notification; created: boolean }
>;

@Injectable()
export class CreateNotificationUseCase {
  constructor(
    private readonly idempotencyKeyRepository: IdempotencyKeyRepository,
    private readonly notificationRepository: NotificationRepository,
    private readonly userRepository: UserRepository,
    private readonly eventsService: EventsService,
    private readonly unitOfWork: UnitOfWork
  ) {}

  public async execute({
    input,
    rawHeader
  }: CreateNotificationInput): Promise<CreateNotificationUseCaseResponse> {
    const { content, userId, externalId, priority, templateName } = input;
    const parsed = idempotencyKeySchema.safeParse(rawHeader);

    if (!parsed.success) {
      return left(
        new BadRequestException({
          message: "Validation failed",
          issues: z.treeifyError(parsed.error)
        })
      );
    }

    const ik = parsed.data["idempotency-key"];

    if (!externalId) {
      return left(
        new BadRequestException({
          message: "External ID is required."
        })
      );
    }

    const userExists = await this.userRepository.findById(userId);

    if (!userExists) {
      return left(
        new NotFoundException({
          message: "User not found."
        })
      );
    }

    const result = await this.unitOfWork.run<TxEither>(async tx => {
      const existingIk = await this.idempotencyKeyRepository.findByKey(ik, tx);

      if (existingIk) {
        if (existingIk.responseStatus) {
          return right({
            notification: existingIk.responseBody!,
            created: false
          });
        }

        return left(
          new ConflictException({
            message: "Request is being processed, please retry"
          })
        );
      }

      const idempotencyKey = IdempotencyKey.create({
        key: ik,
        expiresAt: addHours(new Date(), 24)
      });

      await this.idempotencyKeyRepository.create(idempotencyKey, tx);

      const existingNotification =
        await this.notificationRepository.findByUserAndExternalId(
          userId,
          externalId,
          tx
        );

      if (existingNotification) {
        await this.idempotencyKeyRepository.update(
          ik,
          { responseStatus: 201, responseBody: existingNotification },
          tx
        );

        return right({ notification: existingNotification, created: false });
      }

      const notification = Notification.create({
        content,
        userId: new UniqueEntityID(userId),
        externalId,
        priority,
        status: NotificationStatus.PENDING,
        templateName
      });

      const created = await this.notificationRepository.create(
        notification,
        tx
      );

      await this.idempotencyKeyRepository.update(
        ik,
        { responseStatus: 201, responseBody: created },
        tx
      );

      return right({ notification: created, created: true });
    });

    if (result.isLeft()) return left(result.value);

    if (result.value.created) {
      await this.emitEvent(result.value.notification);
    }

    return right({ notification: result.value.notification });
  }

  private async emitEvent(notification: Notification): Promise<void> {
    if (notification.priority === "HIGH") {
      await this.eventsService.emitHigh(MESSAGE_PATTERNS.NOTIFICATION_PENDING, {
        notificationId: notification.id.toString(),
        userId: notification.userId.toString()
      });
    } else if (notification.priority === "MEDIUM") {
      await this.eventsService.emitMedium(
        MESSAGE_PATTERNS.NOTIFICATION_PENDING,
        {
          notificationId: notification.id.toString(),
          userId: notification.userId.toString()
        }
      );
    } else {
      await this.eventsService.emitLow(MESSAGE_PATTERNS.NOTIFICATION_PENDING, {
        notificationId: notification.id.toString(),
        userId: notification.userId.toString()
      });
    }
  }
}
