import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Notification } from "@/domain/entities/notification";
import type { NotificationPriority } from "@/domain/enums/notification-priority";
import type { NotificationStatus } from "@/domain/enums/notification-status";
import type {
  Prisma,
  Notification as PrismaNotification
} from "@prisma/client";

export class PrismaNotificationMapper {
  static toDomain(raw: PrismaNotification): Notification {
    return Notification.create(
      {
        content: raw.content,
        externalId: raw.externalId,
        userId: new UniqueEntityID(raw.userId),
        createdAt: raw.createdAt,
        templateName: raw.templateName,
        priority: raw.priority as NotificationPriority,
        status: raw.status as NotificationStatus
      },
      new UniqueEntityID(raw.id)
    );
  }

  static toPrisma(
    notification: Notification
  ): Prisma.NotificationUncheckedCreateInput {
    return {
      content: notification.content,
      externalId: notification.externalId,
      templateName: notification.templateName,
      priority: notification.priority,
      status: notification.status,
      createdAt: notification.createdAt,
      userId: notification.userId.toString()
    };
  }
}
