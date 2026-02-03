import type { Notification } from "../entities/notification";

export abstract class NotificationRepository {
  abstract findById(id: string): Promise<Notification | null>;
  abstract create(
    notification: Notification,
    tx?: unknown
  ): Promise<Notification>;
  abstract update(notification: Notification): Promise<void>;
  abstract findByUserAndExternalId(
    userId: string,
    externalId: string,
    tx?: unknown
  ): Promise<Notification | null>;
}
