import { NotificationPriority } from "@/domain/enums/notification-priority";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const createNotificationBodySchema = z.object({
  userId: z.uuid(),
  templateName: z.string().min(1),
  content: z.record(z.string(), z.any()),
  priority: z.enum(NotificationPriority),
  externalId: z.string().optional()
});

export const idempotencyKeySchema = z.object({
  "idempotency-key": z.uuid()
});

export class CreateNotificationDto extends createZodDto(
  createNotificationBodySchema
) {}
