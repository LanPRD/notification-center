import type { User } from "@/domain/entities/user";
import type { UserPreference } from "@/domain/entities/user-preference";
import { NotificationRepository } from "@/domain/repositories/notification-repository";
import { UserPreferencesRepository } from "@/domain/repositories/user-preferences-repository";
import { UserRepository } from "@/domain/repositories/user-repository";
import { Injectable, Logger } from "@nestjs/common";

interface OnNotificationCreatedInput {
  notificationId: string;
  userId: string;
}

@Injectable()
export class OnNotificationCreated {
  private readonly logger = new Logger(OnNotificationCreated.name);

  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly userPrefRepository: UserPreferencesRepository,
    private readonly userRepository: UserRepository
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

    const _logs = [];

    if (channels.includes("EMAIL")) {
      // Send email notification
    }

    if (channels.includes("SMS")) {
      // Send SMS notification
    }

    if (channels.includes("PUSH")) {
      // Send push notification
    }

    // save logs to database
    // update final status of the notification
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
}
