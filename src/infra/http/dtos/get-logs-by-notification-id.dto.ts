import { NotificationLogStatus } from "@/domain/enums/notification-log-status";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const getLogsByNotificationIdParamSchema = z.object({
  notificationId: z.uuid("Invalid notification ID format")
});

export class GetLogsByNotificationIdParamDto extends createZodDto(
  getLogsByNotificationIdParamSchema
) {}

export const notificationLogResponseSchema = z.object({
  id: z.uuid(),
  notificationId: z.uuid(),
  channel: z.string(),
  status: z.enum(NotificationLogStatus),
  errorMessage: z.string().nullable(),
  sentAt: z.iso.datetime()
});

export const getLogsByNotificationIdResponseSchema = z.array(
  notificationLogResponseSchema
);

export class GetLogsByNotificationIdResponseDto extends createZodDto(
  notificationLogResponseSchema
) {}
