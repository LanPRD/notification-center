export const MESSAGE_PATTERNS = {
  NOTIFICATION_PENDING: "notification.pending",
  NOTIFICATION_SENT: "notification.sent",
  NOTIFICATION_PARTIAL: "notification.partial",
  NOTIFICATION_FAILED: "notification.failed",
  NOTIFICATION_CANCELED: "notification.cenceled"
} as const;

export type MessagePattern =
  (typeof MESSAGE_PATTERNS)[keyof typeof MESSAGE_PATTERNS];
