import { Injectable } from "@nestjs/common";

interface OnNotificationCreatedInput {
  notificationId: string;
  userId: string;
}

@Injectable()
export class OnNotificationCreated {
  async execute({ notificationId, userId }: OnNotificationCreatedInput) {
    console.log(`Notification created: ${notificationId} for user: ${userId}`);
  }
}
