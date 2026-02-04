import { Inject, Injectable, Logger } from "@nestjs/common";
import type { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @Inject("RABBITMQ_HIGH_PRIORITY")
    private readonly highPriorityClient: ClientProxy,
    @Inject("RABBITMQ_MEDIUM_PRIORITY")
    private readonly mediumPriorityClient: ClientProxy,
    @Inject("RABBITMQ_LOW_PRIORITY")
    private readonly lowPriorityClient: ClientProxy
  ) {}

  async emit(pattern: string, data: any): Promise<void> {
    await this.emitMedium(pattern, data);
  }

  async emitHigh(pattern: string, data: any): Promise<void> {
    try {
      await firstValueFrom(this.highPriorityClient.send(pattern, data));
      this.logger.log(
        `Message sent to high priority queue with pattern ${pattern}`
      );
    } catch (error) {
      this.logger.error(`Failed to send message to high priority queue`, error);
      throw error;
    }
  }

  async emitMedium(pattern: string, data: any): Promise<void> {
    try {
      await firstValueFrom(this.mediumPriorityClient.send(pattern, data));
      this.logger.log(
        `Message sent to medium priority queue with pattern ${pattern}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to send message to medium priority queue`,
        error
      );
      throw error;
    }
  }

  async emitLow(pattern: string, data: any): Promise<void> {
    try {
      await firstValueFrom(this.lowPriorityClient.send(pattern, data));
      this.logger.log(
        `Message sent to low priority queue with pattern ${pattern}`
      );
    } catch (error) {
      this.logger.error(`Failed to send message to low priority queue`, error);
      throw error;
    }
  }
}
