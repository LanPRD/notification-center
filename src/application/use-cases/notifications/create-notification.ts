import { BadRequestException } from "@/application/errors/bad-request-exception";
import { ConflictException } from "@/application/errors/conflict-exception";
import { left, right, type Either } from "@/core/either";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { IdempotencyKey } from "@/domain/entities/idempotency-key";
import { Notification } from "@/domain/entities/notification";
import { IdempotencyKeyRepository } from "@/domain/repositories/idempotency-key-repository";
import { NotificationRepository } from "@/domain/repositories/notification-repository";
import { UnitOfWork } from "@/domain/repositories/unit-of-work";
import {
  idempotencyKeySchema,
  type CreateNotificationDto
} from "@/infra/http/dtos/create-notification.dto";
import { Injectable } from "@nestjs/common";
import { addHours } from "date-fns";
import { z } from "zod";

interface CreateNotificationInput {
  input: CreateNotificationDto;
  rawHeader: any;
}

type CreateNotificationUseCaseResponse = Either<
  BadRequestException | ConflictException,
  {
    notification: Notification;
  }
>;

@Injectable()
export class CreateNotificationUseCase {
  constructor(
    private readonly idempotencyKeyRepository: IdempotencyKeyRepository,
    private readonly notificationRepository: NotificationRepository,
    private readonly unitOfWork: UnitOfWork
  ) {}

  public async execute({
    input,
    rawHeader
  }: CreateNotificationInput): Promise<CreateNotificationUseCaseResponse> {
    const { content, userId, externalId, priority, templateName } = input;
    const {
      success,
      data,
      error: error
    } = idempotencyKeySchema.safeParse(rawHeader);

    if (!success) {
      throw new BadRequestException({
        message: "Validation failed",
        issues: z.treeifyError(error)
      });
    }

    const ik = data["idempotency-key"];

    if (await this.idempotencyKeyRepository.findByKey(ik)) {
      return left(
        new ConflictException({
          message:
            "Idempotency key already exists. Please provide a new idempotency key."
        })
      );
    }

    if (!externalId) {
      throw new BadRequestException({
        message: "External ID is required."
      });
    }

    if (await this.notificationRepository.findByExternalId(externalId)) {
      return left(
        new ConflictException({
          message: "Notification with this external ID already exists."
        })
      );
    }

    const result = await this.unitOfWork.run(async tx => {
      const idempotencyKey = IdempotencyKey.create({
        key: ik,
        expiresAt: addHours(new Date(), 24),
        responseBody: {},
        responseStatus: 201
      });

      await this.idempotencyKeyRepository.create(idempotencyKey, tx);

      const notification = Notification.create({
        content,
        userId: new UniqueEntityID(userId),
        externalId,
        priority,
        status: "PENDING",
        templateName
      });

      await this.notificationRepository.create(notification, tx);

      return notification;
    });

    return right({ notification: result });
  }
}
