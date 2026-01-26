import { IdempotencyKey } from "@/domain/entities/idempotency-key";
import type { Notification } from "@/domain/entities/notification";
import type { IdempotencyKeyRepository } from "@/domain/repositories/idempotency-key-repository";
import type { NotificationRepository } from "@/domain/repositories/notification-repository";
import { CreateNotificationUseCase } from "@/application/use-cases/notifications/create-notification";

const idempotencyKeyRepository: IdempotencyKeyRepository = {
  findOne: async (idempotencyKey: string) => {
    return null;
  },
  create: async (idempotencyKey: IdempotencyKey) => {
    return;
  }
};

const notificationRepository: NotificationRepository = {
  findOne: async (externalId: string) => {
    return null;
  },
  create: async (notification: Notification) => {
    return;
  }
};

test("it should be able to create a notification", async () => {
  const useCase = new CreateNotificationUseCase(
    idempotencyKeyRepository,
    notificationRepository
  );

  const content = {
    title: "New notification",
    body: "This is a test notification."
  };

  const answer = await useCase.execute({
    content,
    userId: "user123",
    idempotencyKeyHash: "unique-key",
    externalId: "unique-external-id"
  });

  expect(answer.value).toEqual(content);
});
