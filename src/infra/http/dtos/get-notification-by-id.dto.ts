import { type Prisma } from "@prisma/client";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

export const getNotificationByIdSchema = z.uuid();

export const notificationLogSchema = z.object({
  id: z.uuid(),
  notificationId: z.string().uuid(),
  channel: z.string(),
  status: z.enum(["SUCCESS", "FAILED"]),
  errorMessage: z.string().nullable(),
  sentAt: z.union([z.string()])
});

const userSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  phoneNumber: z.string().nullable(),
  pushToken: z.string().nullable()
});

export const notificationWithLogsAndUserSchema = z.object({
  id: z.uuid(),
  externalId: z.string().nullable(),
  userId: z.uuid(),
  templateName: z.string(),
  content: z.unknown(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  status: z.enum(["PENDING", "SENT", "PARTIAL", "FAILED", "CANCELED"]),
  createdAt: z.union([z.string()]),
  user: userSchema,
  logs: z.array(notificationLogSchema)
});

export type GetNotificationResponse = Prisma.NotificationGetPayload<{
  include: { logs: true; user: true };
}>;

export class GetNotificationResponseDto extends createZodDto(
  notificationWithLogsAndUserSchema
) {}
