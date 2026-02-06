import { NotificationPriority } from "@/domain/enums/notification-priority";

export interface CreateNotificationInputDto {
  userId: string;
  templateName: string;
  content: Record<string, any>;
  priority: NotificationPriority;
  externalId?: string;
}

export interface CreateNotificationHeadersDto {
  "idempotency-key": string;
}
