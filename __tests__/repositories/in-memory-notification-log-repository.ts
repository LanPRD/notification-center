import type { NotificationLog } from "@/domain/entities/notification-log";
import type { NotificationLogRepository } from "@/domain/repositories/notification-log-repository";

export class InMemoryNotificationLogRepository implements NotificationLogRepository {
  public notificationLogs: NotificationLog[] = [];

  create(log: NotificationLog): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async createMany(logs: NotificationLog[]): Promise<void> {
    this.notificationLogs.push(...logs);
  }

  async getByNotificationId(
    notificationId: string
  ): Promise<NotificationLog[]> {
    return this.notificationLogs.filter(
      log => log.notificationId.toString() === notificationId
    );
  }
}
