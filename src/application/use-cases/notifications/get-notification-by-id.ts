import { NotFoundException } from "@/application/errors/not-found-exception";
import { left, right, type Either } from "@/core/either";
import type { Notification } from "@/domain/entities/notification";
import { NotificationRepository } from "@/domain/repositories/notification-repository";
import { Injectable } from "@nestjs/common";

type GetNotificationUseCaseResponse = Either<
  NotFoundException,
  { notification: Notification }
>;

@Injectable()
export class GetNotificationByIdUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository
  ) {}

  public async execute(
    notificationId: string
  ): Promise<GetNotificationUseCaseResponse> {
    const notification =
      await this.notificationRepository.findById(notificationId);

    if (!notification) {
      return left(
        new NotFoundException({
          message: `Notification with id ${notificationId} not found.`
        })
      );
    }

    return right({ notification });
  }
}
