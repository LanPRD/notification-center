import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const cancelNotificationParamSchema = z.object({
  id: z.uuid("Invalid notification ID format")
});

export class CancelNotificationParamDto extends createZodDto(
  cancelNotificationParamSchema
) {}

export const cancelNotificationResponseSchema = z.object({
  id: z.uuid(),
  status: z.literal("CANCELED"),
  canceledAt: z.iso.datetime()
});

export class CancelNotificationResponseDto extends createZodDto(
  cancelNotificationResponseSchema
) {}
