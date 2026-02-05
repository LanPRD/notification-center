import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Notification } from "@/domain/entities/notification";
import { NotificationPriority } from "@/domain/enums/notification-priority";
import { NotificationStatus } from "@/domain/enums/notification-status";
import { faker } from "@faker-js/faker";

export class NotificationFactory {
  static build(overrides: Partial<Notification> = {}, id?: UniqueEntityID) {
    return Notification.create(
      {
        content: faker.lorem.sentence(),
        externalId: faker.string.uuid(),
        status: NotificationStatus.PENDING,
        priority: NotificationPriority.MEDIUM,
        templateName: faker.lorem.word(),
        ...overrides,
        userId: new UniqueEntityID()
      },
      id ?? new UniqueEntityID()
    );
  }
}
