import type { NotificationLogStatus } from "@/domain/enums/notification-log-status";
import type { NotificationPriority } from "@/domain/enums/notification-priority";
import type { NotificationStatus } from "@/domain/enums/notification-status";

export interface NotificationLogDetails {
  id: string;
  channel: string;
  status: NotificationLogStatus;
  errorMessage: string | null;
  sentAt: Date;
}

export interface NotificationUserDetails {
  id: string;
  email: string;
  phoneNumber: string | null;
  pushToken: string | null;
}

export interface NotificationDetails {
  id: string;
  content: Record<string, unknown>;
  userId: string;
  externalId: string | null;
  templateName: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  createdAt: Date;
  user: NotificationUserDetails;
  logs: NotificationLogDetails[];
}
