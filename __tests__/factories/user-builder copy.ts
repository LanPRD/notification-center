import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Notification } from "@/domain/entities/notification";
import { faker } from "@faker-js/faker";

export function notificationBuilder(
  overrides: Partial<Notification> = {},
  id?: UniqueEntityID
) {
  return Notification.create(
    {
      content: faker.lorem.sentence(),
      externalId: faker.string.uuid(),
      status: "PENDING",
      priority: "MEDIUM",
      templateName: faker.lorem.word(),
      ...overrides,
      userId: new UniqueEntityID()
    },
    id ?? new UniqueEntityID()
  );
}
