import { $Enums } from "@prisma/client";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const createNotificationBodySchema = z.object({
  userId: z.uuid(),
  templateName: z.string().min(1),
  content: z.record(z.string(), z.any()),
  priority: z.enum($Enums.NotificationPriority),
  externalId: z.string().optional()
});

export class CreateNotificationDto extends createZodDto(
  createNotificationBodySchema
) {}
