import { OnNotificationCreated } from "@/application/events/on-notification-created";
import { Controller, Logger } from "@nestjs/common";
import { Ctx, EventPattern, Payload, RmqContext } from "@nestjs/microservices";
import { MESSAGE_PATTERNS } from "../constants";

interface PendingInput {
  notificationId: string;
  userId: string;
}

@Controller()
export class NotificationWorker {
  private readonly logger = new Logger(NotificationWorker.name);

  constructor(private readonly onNotificationCreated: OnNotificationCreated) {}

  @EventPattern(MESSAGE_PATTERNS.NOTIFICATION_PENDING)
  async handleNotificationPending(
    @Payload() data: PendingInput,
    @Ctx() context: RmqContext
  ): Promise<void> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    const pattern = context.getPattern();

    try {
      this.logger.log(`Processing message: ${pattern}`);
      this.logger.debug(`Payload: ${JSON.stringify(data)}`);

      await this.onNotificationCreated.execute(data);

      channel.ack(originalMsg);
      this.logger.log(`Message processed successfully: ${pattern}`);
    } catch (error) {
      this.logger.error(`Error processing message: ${pattern}`, error);
      // Reject and requeue the message
      channel.nack(originalMsg, false, true);
    }
  }

  @EventPattern(MESSAGE_PATTERNS.NOTIFICATION_SENT)
  async handleNotificationSent(
    @Payload() data: any,
    @Ctx() context: RmqContext
  ): Promise<void> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    const pattern = context.getPattern();

    try {
      this.logger.log(`Processing message: ${pattern}`);
      this.logger.debug(`Payload: ${JSON.stringify(data)}`);

      // TODO: Implement logic for sent notification
      // Example: Update database, send confirmation, etc.

      channel.ack(originalMsg);
      this.logger.log(`Message processed successfully: ${pattern}`);
    } catch (error) {
      this.logger.error(`Error processing message: ${pattern}`, error);
      channel.nack(originalMsg, false, true);
    }
  }

  @EventPattern(MESSAGE_PATTERNS.NOTIFICATION_PARTIAL)
  async handleNotificationPartial(
    @Payload() data: any,
    @Ctx() context: RmqContext
  ): Promise<void> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    const pattern = context.getPattern();

    try {
      this.logger.log(`Processing message: ${pattern}`);
      this.logger.debug(`Payload: ${JSON.stringify(data)}`);

      // TODO: Implement logic for partial notification
      // Example: Retry failed channels, update status, etc.

      channel.ack(originalMsg);
      this.logger.log(`Message processed successfully: ${pattern}`);
    } catch (error) {
      this.logger.error(`Error processing message: ${pattern}`, error);
      channel.nack(originalMsg, false, true);
    }
  }

  @EventPattern(MESSAGE_PATTERNS.NOTIFICATION_FAILED)
  async handleNotificationFailed(
    @Payload() data: any,
    @Ctx() context: RmqContext
  ): Promise<void> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    const pattern = context.getPattern();

    try {
      this.logger.log(`Processing message: ${pattern}`);
      this.logger.debug(`Payload: ${JSON.stringify(data)}`);

      // TODO: Implement logic for failed notification
      // Example: Retry, log error, send alert, etc.

      channel.ack(originalMsg);
      this.logger.log(`Message processed successfully: ${pattern}`);
    } catch (error) {
      this.logger.error(`Error processing message: ${pattern}`, error);
      channel.nack(originalMsg, false, true);
    }
  }

  @EventPattern(MESSAGE_PATTERNS.NOTIFICATION_CANCELED)
  async handleNotificationCanceled(
    @Payload() data: any,
    @Ctx() context: RmqContext
  ): Promise<void> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    const pattern = context.getPattern();

    try {
      this.logger.log(`Processing message: ${pattern}`);
      this.logger.debug(`Payload: ${JSON.stringify(data)}`);

      // TODO: Implement logic for canceled notification
      // Example: Stop processing, cleanup resources, etc.

      channel.ack(originalMsg);
      this.logger.log(`Message processed successfully: ${pattern}`);
    } catch (error) {
      this.logger.error(`Error processing message: ${pattern}`, error);
      channel.nack(originalMsg, false, true);
    }
  }
}
