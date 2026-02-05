import { NotificationLogStatus } from "@/domain/enums/notification-log-status";
import { NotificationPriority } from "@/domain/enums/notification-priority";
import { NotificationStatus } from "@/domain/enums/notification-status";

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
  content: Record<string, any>;
  userId: string;
  externalId: string | null;
  templateName: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  createdAt: Date;
  user: NotificationUserDetails;
  logs: NotificationLogDetails[];
}
