import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import {
  Notification,
  type NotificationProps
} from "@/domain/entities/notification";
import { NotificationPriority } from "@/domain/enums/notification-priority";
import { NotificationStatus } from "@/domain/enums/notification-status";
import { TemplateName } from "@/domain/value-objects/template-name";
import { PrismaNotificationMapper } from "@/infra/database/mappers/prisma-notification-mapper";
import { PrismaService } from "@/infra/database/prisma/prisma.service";
import { faker } from "@faker-js/faker";
import { Injectable } from "@nestjs/common";

export class NotificationFactory {
  static build(
    overrides: Partial<NotificationProps> = {},
    id?: UniqueEntityID,
    userId?: UniqueEntityID
  ) {
    return Notification.create(
      {
        content: faker.lorem.sentence(),
        externalId: faker.string.uuid(),
        status: NotificationStatus.PENDING,
        priority: NotificationPriority.MEDIUM,
        templateName: NotificationFactory.generateValidTemplateName(),
        ...overrides,
        userId: userId ?? new UniqueEntityID()
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

@Injectable()
export class PrismaNotificationFactory {
  constructor(private readonly prisma: PrismaService) {}

  async build(
    data: Partial<NotificationProps> = {},
    id: UniqueEntityID,
    userId?: UniqueEntityID
  ): Promise<Notification> {
    const notification = NotificationFactory.build(data, id, userId);

    await this.prisma.notification.create({
      data: PrismaNotificationMapper.toPrisma(notification)
    });

    return notification;
  }
}
