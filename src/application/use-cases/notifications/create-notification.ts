import type { CreateNotificationUseCaseResponse } from "@/application/dtos/create-notification-response.dto";
import { ConflictException } from "@/application/errors/conflict-exception";
import { left, right } from "@/core/either";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { IdempotencyKey } from "@/domain/entities/idempotency-key";
import { Notification } from "@/domain/entities/notification";
import type { IdempotencyKeyRepository } from "@/domain/repositories/idempotency-key-repository";
import type { NotificationRepository } from "@/domain/repositories/notification-repository";
import type { UnitOfWork } from "@/domain/repositories/unit-of-work";
import { addHours } from "date-fns";

interface CreateNotificationInput {
  idempotencyKeyHash: string;
  userId: string;
  content: Record<string, unknown>;
  externalId: string;
}

export class CreateNotificationUseCase {
  constructor(
    private readonly idempotencyKeyRepository: IdempotencyKeyRepository,
    private readonly notificationRepository: NotificationRepository,
    private readonly unitOfWork: UnitOfWork
  ) {}

  public async execute(
    input: CreateNotificationInput
  ): Promise<CreateNotificationUseCaseResponse> {
    const { content, userId, idempotencyKeyHash, externalId } = input;

    if (await this.idempotencyKeyRepository.findOne(idempotencyKeyHash)) {
      return left(new ConflictException());
    }

    const result = await this.unitOfWork.run(async tx => {
      const idempotencyKey = IdempotencyKey.create({
        key: idempotencyKeyHash,
        expiresAt: addHours(new Date(), 24),
        responseBody: {},
        responseStatus: 201
      });

      await this.idempotencyKeyRepository.create(idempotencyKey, tx);

      const notification = Notification.create({
        content,
        userId: new UniqueEntityID(userId),
        externalId,
        priority: "MEDIUM",
        status: "PENDING",
        templateName: "default"
      });

      await this.notificationRepository.create(notification, tx);

      return notification;
    });

    return right({ notification: result });
  }
}
