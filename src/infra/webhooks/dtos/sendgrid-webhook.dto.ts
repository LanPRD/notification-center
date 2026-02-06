import { createZodDto } from "nestjs-zod";
import { z } from "zod";

// https://docs.sendgrid.com/for-developers/tracking-events/event
export const sendGridEventSchema = z.object({
  email: z.email(),
  timestamp: z.number(),
  event: z.enum([
    "processed",
    "dropped",
    "delivered",
    "deferred",
    "bounce",
    "open",
    "click",
    "spamreport",
    "unsubscribe",
    "group_unsubscribe",
    "group_resubscribe"
  ]),
  sg_message_id: z.string().optional(),
  notification_id: z.uuid().optional(),
  reason: z.string().optional(),
  status: z.string().optional(),
  useragent: z.string().optional(),
  ip: z.string().optional(),
  url: z.string().optional()
});

export const sendGridWebhookBodySchema = z.array(sendGridEventSchema);

export class SendGridWebhookBodyDto extends createZodDto(
  sendGridWebhookBodySchema
) {}
