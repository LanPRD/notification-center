import type { NotificationDetails } from "@/domain/types/notification-details";
import { NotificationRepository } from "@/domain/repositories/notification-repository";
import { Injectable } from "@nestjs/common";

@Injectable()
export class GetAllNotificationsByUserIdUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository
  ) {}

  public async execute(): Promise<NotificationDetails[]> {
    return this.notificationRepository.getAllWithDetails();
  }
}
