import type { Notification } from "@/domain/entities/notification";
import type { NotificationRepository } from "@/domain/repositories/notification-repository";

export class InMemoryNotificationRepository implements NotificationRepository {
  public notifications: Notification[] = [];

  async findByUserAndExternalId(
    userId: string,
    externalId: string
  ): Promise<Notification | null> {
    return Promise.resolve(
      this.notifications.find(
        n => n.externalId === externalId && n.userId === userId
      ) ?? null
    );
  }

  snapshot() {
    return [...this.notifications];
  }

  restore(s: Notification[]) {
    this.notifications = [...s];
  }

  async create(notification: Notification): Promise<Notification> {
    this.notifications.push(notification);
    return notification;
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
