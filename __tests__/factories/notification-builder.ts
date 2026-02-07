import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Notification } from "@/domain/entities/notification";
import { NotificationPriority } from "@/domain/enums/notification-priority";
import { NotificationStatus } from "@/domain/enums/notification-status";
import { TemplateName } from "@/domain/value-objects/template-name";
import { faker } from "@faker-js/faker";

export class NotificationFactory {
  static build(overrides: Partial<Notification> = {}, id?: UniqueEntityID) {
    return Notification.create(
      {
        content: faker.lorem.sentence(),
        externalId: faker.string.uuid(),
        status: NotificationStatus.PENDING,
        priority: NotificationPriority.MEDIUM,
        templateName: NotificationFactory.generateValidTemplateName(),
        ...overrides,
        userId: new UniqueEntityID()
      },
      id ?? new UniqueEntityID()
    );
  }

  static generateValidTemplateName(name?: string): TemplateName {
    const slug = name ? name : faker.helpers.slugify(faker.lorem.words(2));
    const templateOrError = TemplateName.create(slug);

    if (templateOrError.isLeft()) {
      throw new Error("Failed to generate valid template name");
    }

    return templateOrError.value;
  }
}
