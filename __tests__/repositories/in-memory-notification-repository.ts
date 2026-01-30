import type { Notification } from "@/domain/entities/notification";
import type { NotificationRepository } from "@/domain/repositories/notification-repository";

export class InMemoryNotificationRepository implements NotificationRepository {
  public notifications: Notification[] = [];

  snapshot() {
    return [...this.notifications];
  }

  restore(s: Notification[]) {
    this.notifications = [...s];
  }

  async findByExternalId(externalId: string): Promise<Notification | null> {
    return this.notifications.find(n => n.externalId === externalId) ?? null;
  }

  async create(notification: Notification): Promise<void> {
    this.notifications.push(notification);
  }

  async findById(id: string): Promise<Notification | null> {
    return this.notifications.find(n => n.id.toString() === id) ?? null;
  }

  async update(notification: Notification): Promise<void> {
    const index = this.notifications.findIndex(
      n => n.id.toString() === notification.id.toString()
    );

    if (index !== -1) {
      this.notifications[index] = notification;
    }
  }
}
