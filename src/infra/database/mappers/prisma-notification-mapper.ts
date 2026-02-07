import type { NotificationDetails } from "@/domain/types/notification-details";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Notification } from "@/domain/entities/notification";
import type { NotificationLogStatus } from "@/domain/enums/notification-log-status";
import type { NotificationPriority } from "@/domain/enums/notification-priority";
import type { NotificationStatus } from "@/domain/enums/notification-status";
import { TemplateName } from "@/domain/value-objects/template-name";
import type {
  Prisma,
  Notification as PrismaNotification,
  NotificationLog as PrismaNotificationLog,
  User as PrismaUser
} from "@prisma/client";

export class PrismaNotificationMapper {
  static toDomain(raw: PrismaNotification): Notification {
    const templateNameOrError = TemplateName.create(raw.templateName);

    if (templateNameOrError.isLeft()) {
      throw new Error(`Invalid template name in database: ${raw.templateName}`);
    }

    return Notification.create(
      {
        content: raw.content,
        externalId: raw.externalId,
        userId: new UniqueEntityID(raw.userId),
        createdAt: raw.createdAt,
        templateName: templateNameOrError.value,
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
      templateName: notification.templateName.value,
      priority: notification.priority,
      status: notification.status,
      createdAt: notification.createdAt,
      userId: notification.userId.toString()
    };
  }

  static toDetails(
    raw: PrismaNotification & {
      user: PrismaUser;
      logs: PrismaNotificationLog[];
    }
  ): NotificationDetails {
    return {
      id: raw.id,
      content: raw.content as Record<string, any>,
      userId: raw.userId,
      externalId: raw.externalId,
      templateName: raw.templateName,
      priority: raw.priority as NotificationPriority,
      status: raw.status as NotificationStatus,
      createdAt: raw.createdAt,
      user: {
        id: raw.user.id,
        email: raw.user.email,
        phoneNumber: raw.user.phoneNumber,
        pushToken: raw.user.pushToken
      },
      logs: raw.logs.map(log => ({
        id: log.id,
        channel: log.channel,
        status: log.status as NotificationLogStatus,
        errorMessage: log.errorMessage,
        sentAt: log.sentAt
      }))
    };
  }

  static toJSON(notification: Notification): Prisma.InputJsonValue {
    return {
      id: notification.id.toString(),
      content: notification.content as Prisma.InputJsonValue,
      externalId: notification.externalId,
      templateName: notification.templateName.value,
      priority: notification.priority,
      status: notification.status,
      createdAt: notification.createdAt.toISOString(),
      userId: notification.userId.toString()
    };
  }
}
