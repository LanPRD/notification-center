import type { NotificationLog } from "../entities/notification-log";

export abstract class NotificationLogRepository {
  abstract create(log: NotificationLog): Promise<void>;
}
