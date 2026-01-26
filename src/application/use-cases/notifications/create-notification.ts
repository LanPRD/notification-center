import type { CreateNotificationUseCaseResponse } from "@/application/dtos/create-notification-response.dto";
import { right } from "@/core/either";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { IdempotencyKey } from "@/domain/entities/idempotency-key";
import { Notification } from "@/domain/entities/notification";
import type { IdempotencyKeyRepository } from "@/domain/repositories/idempotency-key-repository";
import type { NotificationRepository } from "@/domain/repositories/notification-repository";
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
    private readonly notificationRepository: NotificationRepository
  ) {}

  public async execute(
    input: CreateNotificationInput
  ): Promise<CreateNotificationUseCaseResponse> {
    const { content, userId, idempotencyKeyHash, externalId } = input;

    if (await this.idempotencyKeyRepository.findOne(idempotencyKeyHash)) {
      throw new Error("Idempotency key already exists");
    }

    const idempotencyKey = IdempotencyKey.create({
      key: idempotencyKeyHash,
      expiresAt: addHours(new Date(), 24),
      responseBody: {},
      responseStatus: 201
    });

    await this.idempotencyKeyRepository.create(idempotencyKey);

    const notification = Notification.create({
      content,
      userId: new UniqueEntityID(userId),
      externalId,
      priority: "MEDIUM",
      status: "SENT",
      templateName: "default"
    });

    await this.notificationRepository.create(notification);

    return right({ notification });
  }
}
