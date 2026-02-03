import type { Notification } from "@/domain/entities/notification";

export class NotificationPresenter {
  static toHTTP(notification: Notification) {
    return {
      id: notification.id.toString(),
      status: notification.status,
      priority: notification.priority,
      createdAt: notification.createdAt.toISOString()
    };
  }
}
