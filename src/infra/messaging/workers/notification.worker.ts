import { Controller, Logger } from "@nestjs/common";
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext
} from "@nestjs/microservices";
import { MESSAGE_PATTERNS } from "../constants";

@Controller()
export class NotificationWorker {
  private readonly logger = new Logger(NotificationWorker.name);

  @MessagePattern(MESSAGE_PATTERNS.NOTIFICATION_PENDING)
  async handleNotificationPending(
    @Payload() data: any,
    @Ctx() context: RmqContext
  ): Promise<void> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    const pattern = context.getPattern();

    try {
      this.logger.log(`Processing message: ${pattern}`);
      this.logger.debug(`Payload: ${JSON.stringify(data)}`);

      // TODO: Implement notification processing logic here
      // Example: Send email, push notification, SMS, etc.

      channel.ack(originalMsg);
      this.logger.log(`Message processed successfully: ${pattern}`);
    } catch (error) {
      this.logger.error(`Error processing message: ${pattern}`, error);
      // Reject and requeue the message
      channel.nack(originalMsg, false, true);
    }
  }

  @MessagePattern(MESSAGE_PATTERNS.NOTIFICATION_SENT)
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

  @MessagePattern(MESSAGE_PATTERNS.NOTIFICATION_FAILED)
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
}
