import type { NotificationLog } from "@/domain/entities/notification-log";

export class NotificationLogPresenter {
  static toHTTP(notificationLog: NotificationLog) {
    return {
      id: notificationLog.id.toString(),
      notificationId: notificationLog.notificationId.toString(),
      channel: notificationLog.channel,
      status: notificationLog.status,
      errorMessage: notificationLog.errorMessage,
      sentAt: notificationLog.sentAt.toISOString()
    };
  }
}
