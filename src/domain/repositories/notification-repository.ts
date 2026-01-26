import type { Notification } from "../entities/notification";

export interface NotificationRepository {
  findOne(externalId: string): Promise<Notification | null>;
  create(notification: Notification): Promise<void>;
}
