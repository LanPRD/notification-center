import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.url(),
  DATABASE_SCHEMA: z.string(),
  PORT: z.coerce.number().optional().default(3000),
  RABBITMQ_URL: z.coerce.string().default("amqp://guest:guest@localhost:5672"),
  RABBITMQ_QUEUE_HIGH: z.string().default("notifications.high"),
  RABBITMQ_QUEUE_MEDIUM: z.string().default("notifications.medium"),
  RABBITMQ_QUEUE_LOW: z.string().default("notifications.low")
});

export type Env = z.infer<typeof envSchema>;
