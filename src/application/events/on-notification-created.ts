import type { Notification } from "@/domain/entities/notification";
import { NotificationLog } from "@/domain/entities/notification-log";
import type { User } from "@/domain/entities/user";
import type { UserPreference } from "@/domain/entities/user-preference";
import { NotificationLogStatus } from "@/domain/enums/notification-log-status";
import { NotificationStatus } from "@/domain/enums/notification-status";
import { NotificationLogRepository } from "@/domain/repositories/notification-log-repository";
import { NotificationRepository } from "@/domain/repositories/notification-repository";
import { UserPreferenceRepository } from "@/domain/repositories/user-preference-repository";
import { UserRepository } from "@/domain/repositories/user-repository";
import { MESSAGE_PATTERNS } from "@/infra/messaging/constants";
import { EventsService } from "@/infra/messaging/publishers/events.service";
import { Injectable, Logger } from "@nestjs/common";

interface OnNotificationCreatedInput {
  notificationId: string;
  userId: string;
}

@Injectable()
export class OnNotificationCreated {
  private readonly logger = new Logger(OnNotificationCreated.name);

  constructor(
    private readonly notificationLogsRepository: NotificationLogRepository,
    private readonly notificationRepository: NotificationRepository,
    private readonly userPrefRepository: UserPreferenceRepository,
    private readonly userRepository: UserRepository,
    private readonly eventsService: EventsService
  ) {}

  async execute(props: OnNotificationCreatedInput): Promise<void> {
    const { notificationId, userId } = props;

    const notification =
      await this.notificationRepository.findById(notificationId);

    if (!notification) {
      throw new Error(`Notification with id ${notificationId} not found.`);
    }

    if (notification.status !== "PENDING") {
      this.logger.warn(
        `Notification with id ${notificationId} is not PENDING, skipping...`
      );
      return;
    }

    const user = await this.userRepository.findById(userId);
    const userPrefs = await this.userPrefRepository.findByUserId(userId);

    if (!user || !userPrefs) {
      throw new Error(`User with id ${userId} not found.`);
    }

    const channels = this.determineChannels(user, userPrefs);
    const logs = this.createNotificationLogs(channels, notification);

    await this.notificationLogsRepository.createMany(logs);

    const finalStatus = this.calculateFinalStatus(logs);

    await this.emitEvent(notificationId, finalStatus).catch(err =>
      this.logger.error("Failed to emit event", err)
    );

    await this.notificationRepository.updateStatus(notificationId, finalStatus);
  }

  private determineChannels(user: User, userPrefs: UserPreference): string[] {
    const channels: string[] = [];

    if (userPrefs.allowEmail && user.email) {
      channels.push("EMAIL");
    }

    if (userPrefs.allowSMS && user.phoneNumber) {
      channels.push("SMS");
    }

    if (userPrefs.allowPush && user.pushToken) {
      channels.push("PUSH");
    }

    return channels;
  }

  private createNotificationLogs(
    channels: string[],
    notification: Notification
  ): NotificationLog[] {
    const logs: NotificationLog[] = [];

    if (channels.includes("EMAIL")) {
      // Send email notification
      const result = true; // Replace with actual email sending logic

      // add log to logs array
      logs.push(
        NotificationLog.create({
          notificationId: notification.id,
          channel: "EMAIL",
          status:
            result ?
              NotificationLogStatus.SUCCESS
            : NotificationLogStatus.FAILED,
          sentAt: new Date(),
          errorMessage: null
        })
      );
    }

    if (channels.includes("SMS")) {
      // Send SMS notification
      const result = true; // Replace with actual SMS sending logic

      // add log to logs array
      logs.push(
        NotificationLog.create({
          notificationId: notification.id,
          channel: "SMS",
          status:
            result ?
              NotificationLogStatus.SUCCESS
            : NotificationLogStatus.FAILED,
          sentAt: new Date(),
          errorMessage: null
        })
      );
    }

    if (channels.includes("PUSH")) {
      // Send push notification
      const result = false; // Replace with actual push notification sending logic

      // add log to logs array
      logs.push(
        NotificationLog.create({
          notificationId: notification.id,
          channel: "PUSH",
          status:
            result ?
              NotificationLogStatus.SUCCESS
            : NotificationLogStatus.FAILED,
          sentAt: new Date(),
          errorMessage: null
        })
      );
    }

    return logs;
  }

  private calculateFinalStatus(logs: NotificationLog[]): NotificationStatus {
    const successLogs = logs.filter(log => log.status === "SUCCESS").length;
    const totalAttempts = logs.length;

    if (totalAttempts === 0) {
      return NotificationStatus.FAILED;
    }

    if (successLogs === 0) {
      return NotificationStatus.FAILED;
    }

    if (successLogs < totalAttempts) {
      return NotificationStatus.PARTIAL;
    }

    return NotificationStatus.SENT;
  }

  private async emitEvent(notificationId: string, status: NotificationStatus) {
    if (status === NotificationStatus.PARTIAL) {
      await this.eventsService.emitLow(
        MESSAGE_PATTERNS.NOTIFICATION_PARTIAL,
        notificationId
      );
    } else if (status === NotificationStatus.FAILED) {
      await this.eventsService.emitLow(
        MESSAGE_PATTERNS.NOTIFICATION_FAILED,
        notificationId
      );
    } else if (status === NotificationStatus.SENT) {
      await this.eventsService.emitLow(
        MESSAGE_PATTERNS.NOTIFICATION_SENT,
        notificationId
      );
    }
  }
}
