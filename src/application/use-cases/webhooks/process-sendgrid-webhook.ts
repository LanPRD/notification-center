import type { SendGridEventInputDto } from "@/application/dtos/process-sendgrid-webhook-input.dto";
import { Either, right } from "@/core/either";
import { NotificationLogStatus } from "@/domain/enums/notification-log-status";
import { NotificationLogRepository } from "@/domain/repositories/notification-log-repository";
import { NotificationRepository } from "@/domain/repositories/notification-repository";
import { Injectable, Logger } from "@nestjs/common";

const EVENT_STATUS_MAP: Record<string, NotificationLogStatus | null> = {
  delivered: NotificationLogStatus.SUCCESS,
  bounce: NotificationLogStatus.FAILED,
  dropped: NotificationLogStatus.FAILED,
  deferred: null, // Transient state, no action needed
  processed: null, // Intermediate state
  open: null, // Engagement event, could be tracked separately
  click: null, // Engagement event, could be tracked separately
  spamreport: NotificationLogStatus.FAILED,
  unsubscribe: null, // Preference change, handled elsewhere
  group_unsubscribe: null,
  group_resubscribe: null
};

interface ProcessSendGridWebhookInput {
  events: SendGridEventInputDto[];
}

type ProcessSendGridWebhookOutput = Either<
  null,
  { processedCount: number; skippedCount: number }
>;

@Injectable()
export class ProcessSendGridWebhookUseCase {
  private readonly logger = new Logger(ProcessSendGridWebhookUseCase.name);

  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly notificationLogRepository: NotificationLogRepository
  ) {}

  async execute(
    input: ProcessSendGridWebhookInput
  ): Promise<ProcessSendGridWebhookOutput> {
    let processedCount = 0;
    let skippedCount = 0;

    for (const event of input.events) {
      const status = EVENT_STATUS_MAP[event.event];

      // Skip events that don't require status updates
      if (status === null || status === undefined) {
        this.logger.debug(
          `Skipping event type: ${event.event} for ${event.email}`
        );
        skippedCount++;
        continue;
      }

      // Skip events without notification reference
      if (!event.notificationId) {
        this.logger.warn(
          `Event ${event.event} received without notification_id for ${event.email}`
        );
        skippedCount++;
        continue;
      }

      const notification = await this.notificationRepository.findById(
        event.notificationId
      );

      if (!notification) {
        this.logger.warn(`Notification not found: ${event.notificationId}`);
        skippedCount++;
        continue;
      }

      // 1. Create a new notification log entry
      // 2. Update notification status if needed
      // 3. Trigger any follow-up actions (retry, alert, etc.)

      this.logger.log(
        `Processed ${event.event} event for notification ${event.notificationId}`
      );
      processedCount++;
    }

    return right({ processedCount, skippedCount });
  }
}
