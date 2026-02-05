import type { NotificationLog } from "@/domain/entities/notification-log";
import { NotificationLogRepository } from "@/domain/repositories/notification-log-repository";
import { Injectable } from "@nestjs/common";

@Injectable()
export class GetLogsByNotificationIdUseCase {
  constructor(
    private readonly notificationLogRepository: NotificationLogRepository
  ) {}

  public async execute(notificationId: string): Promise<NotificationLog[]> {
    return this.notificationLogRepository.getByNotificationId(notificationId);
  }
}
