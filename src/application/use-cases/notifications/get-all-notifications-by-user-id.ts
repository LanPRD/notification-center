import type { NotificationDetails } from "@/application/dtos/notification-details.dto";
import { NotFoundException } from "@/application/errors/not-found-exception";
import { right, type Either } from "@/core/either";
import { NotificationRepository } from "@/domain/repositories/notification-repository";
import { Injectable } from "@nestjs/common";

type GetAllNotificationsByUserIdUseCaseResponse = Either<
  NotFoundException,
  { notifications: NotificationDetails[] }
>;

@Injectable()
export class GetAllNotificationsByUserIdUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository
  ) {}

  public async execute(): Promise<GetAllNotificationsByUserIdUseCaseResponse> {
    const notifications = await this.notificationRepository.getAllWithDetails();
    return right({ notifications });
  }
}
