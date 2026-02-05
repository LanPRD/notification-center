import { NotificationPriority } from "@/domain/enums/notification-priority";
import { NotificationStatus } from "@/domain/enums/notification-status";
import { NotificationLogStatus } from "@prisma/client";
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const notificationLogDetailsSchema = z.object({
  id: z.uuid(),
  channel: z.string(),
  status: z.enum(NotificationLogStatus),
  errorMessage: z.string().nullable(),
  sentAt: z.iso.datetime()
});

const notificationUserDetailsSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  phoneNumber: z.string().nullable(),
  pushToken: z.string().nullable()
});

export const notificationDetailsSchema = z.object({
  id: z.uuid(),
  externalId: z.string().nullable(),
  userId: z.uuid(),
  templateName: z.string(),
  content: z.unknown(),
  priority: z.enum(NotificationPriority),
  status: z.enum(NotificationStatus),
  createdAt: z.iso.datetime(),
  user: notificationUserDetailsSchema,
  logs: z.array(notificationLogDetailsSchema)
});

export const getAllNotificationsResponseSchema = z.array(
  notificationDetailsSchema
);

export class NotificationDetailsResponseDto extends createZodDto(
  notificationDetailsSchema
) {}
