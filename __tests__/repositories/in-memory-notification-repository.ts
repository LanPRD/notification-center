import type { Notification } from "@/domain/entities/notification";
import type { NotificationRepository } from "@/domain/repositories/notification-repository";

export class InMemoryNotificationRepository implements NotificationRepository {
  public notifications: Notification[] = [];

  async findOne(externalId: string): Promise<Notification | null> {
    return this.notifications.find(n => n.externalId === externalId) ?? null;
  }
  async create(notification: Notification): Promise<void> {
    this.notifications.push(notification);
  }
}
