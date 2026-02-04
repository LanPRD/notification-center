export const QUEUES = {
  HIGH: "notifications.high",
  MEDIUM: "notifications.medium",
  LOW: "notifications.low"
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];
