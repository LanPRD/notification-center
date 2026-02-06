import type { NotificationDetails } from "@/domain/types/notification-details";
import type { Notification } from "../entities/notification";
import type { NotificationStatus } from "../enums/notification-status";

export abstract class NotificationRepository {
  abstract findById(id: string): Promise<Notification | null>;
  abstract getAllWithDetails(): Promise<NotificationDetails[]>;
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
  abstract updateStatus(id: string, status: NotificationStatus): Promise<void>;
}
