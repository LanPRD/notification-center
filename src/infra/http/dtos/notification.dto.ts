import { NotificationPriority } from "@/domain/enums/notification-priority";
import { NotificationStatus } from "@/domain/enums/notification-status";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

// Request
export const createNotificationBodySchema = z.object({
  userId: z.uuid(),
  templateName: z.string().min(1),
  content: z.record(z.string(), z.any()),
  priority: z.enum(NotificationPriority),
  externalId: z.string().optional()
});

export const idempotencyKeyHeaderSchema = z.object({
  "idempotency-key": z.uuid()
});

export class CreateNotificationBodyDto extends createZodDto(
  createNotificationBodySchema
) {}

// Response
export const notificationResponseSchema = z.object({
  id: z.uuid(),
  externalId: z.string().nullable(),
  userId: z.uuid(),
  templateName: z.string(),
  content: z.unknown(),
  priority: z.enum(NotificationPriority),
  status: z.enum(NotificationStatus),
  createdAt: z.iso.datetime()
});

export class NotificationResponseDto extends createZodDto(
  notificationResponseSchema
) {}
