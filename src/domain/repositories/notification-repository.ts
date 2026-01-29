import type { Notification } from "../entities/notification";

export abstract class NotificationRepository {
  abstract findByExternalId(externalId: string): Promise<Notification | null>;
  abstract findById(id: string): Promise<Notification | null>;
  abstract create(notification: Notification, tx?: unknown): Promise<void>;
}
