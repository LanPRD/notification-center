import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { NotificationLog } from "@/domain/entities/notification-log";
import { NotificationLogStatus } from "@/domain/enums/notification-log-status";
import { faker } from "@faker-js/faker";

export class NotificationLogFactory {
  static buildSuccess(
    notificationId: UniqueEntityID,
    overrides: Partial<NotificationLog> = {},
    id?: UniqueEntityID
  ) {
    return NotificationLog.create(
      {
        channel: faker.lorem.word(),
        errorMessage: null,
        status: NotificationLogStatus.SUCCESS,
        ...overrides,
        notificationId: notificationId
      },
      id ?? new UniqueEntityID()
    );
  }

  static buildFailed(
    notificationId: UniqueEntityID,
    overrides: Partial<NotificationLog> = {},
    id?: UniqueEntityID
  ) {
    return NotificationLog.create(
      {
        channel: faker.lorem.word(),
        errorMessage: faker.lorem.sentence(),
        status: NotificationLogStatus.FAILED,
        ...overrides,
        notificationId: notificationId
      },
      id ?? new UniqueEntityID()
    );
  }
}
