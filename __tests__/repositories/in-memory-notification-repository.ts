import type { Notification } from "@/domain/entities/notification";
import type { NotificationStatus } from "@/domain/enums/notification-status";
import type { NotificationRepository } from "@/domain/repositories/notification-repository";
import type { NotificationDetails } from "@/domain/types/notification-details";

export class InMemoryNotificationRepository implements NotificationRepository {
  public notifications: Notification[] = [];

  async getAllWithDetails(): Promise<NotificationDetails[]> {
    return this.notifications.map(n => ({
      id: n.id.toString(),
      content: n.content,
      userId: n.userId,
      externalId: n.externalId,
      templateName: n.templateName,
      priority: n.priority,
      status: n.status,
      createdAt: n.createdAt,
      user: { id: n.userId, email: "", phoneNumber: null, pushToken: null },
      logs: []
    }));
  }

  async updateStatus(id: string, status: NotificationStatus): Promise<void> {
    const notification = await this.findById(id);

    if (notification) {
      notification.status = status;
    }
  }

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
