import type { NotificationDetails } from "@/domain/types/notification-details";
import type { Notification } from "@/domain/entities/notification";

export class NotificationPresenter {
  static toHTTP(notification: Notification) {
    return {
      id: notification.id.toString(),
      status: notification.status,
      priority: notification.priority,
      createdAt: notification.createdAt,
      userId: notification.userId.toString(),
      externalId: notification.externalId,
      templateName: notification.templateName,
      content: notification.content
    };
  }

  static toHTTPWithDetails(notification: NotificationDetails) {
    return {
      id: notification.id,
      status: notification.status,
      priority: notification.priority,
      createdAt: notification.createdAt,
      userId: notification.userId,
      externalId: notification.externalId,
      templateName: notification.templateName,
      content: notification.content,
      user: {
        id: notification.user.id,
        email: notification.user.email,
        phoneNumber: notification.user.phoneNumber,
        pushToken: notification.user.pushToken
      },
      logs: notification.logs.map(log => ({
        id: log.id,
        channel: log.channel,
        status: log.status,
        errorMessage: log.errorMessage,
        sentAt: log.sentAt
      }))
    };
  }
}
