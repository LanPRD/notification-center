import { ConflictException } from "@/application/errors/conflict-exception";
import { NotFoundException } from "@/application/errors/not-found-exception";
import { left, right, type Either } from "@/core/either";
import { NotificationStatus } from "@/domain/enums/notification-status";
import { NotificationRepository } from "@/domain/repositories/notification-repository";
import { Injectable } from "@nestjs/common";

type CancelNotificationUseCaseResponse = Either<
  NotFoundException | ConflictException,
  {
    id: string;
    status: "CANCELED";
    canceledAt: Date;
  }
>;

@Injectable()
export class CancelNotificationUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository
  ) {}

  public async execute(id: string): Promise<CancelNotificationUseCaseResponse> {
    const notification = await this.notificationRepository.findById(id);

    if (!notification) {
      return left(new NotFoundException({ message: "Notification not found" }));
    }

    if (notification.status !== "PENDING") {
      return left(
        new ConflictException({
          message: "Notification can only be canceled in the PENDING state",
          issues: { currentStatus: notification.status }
        })
      );
    }

    notification.status = NotificationStatus.CANCELED;

    await this.notificationRepository.update(notification);

    return right({
      id: notification.id.toString(),
      status: notification.status,
      canceledAt: new Date()
    });
  }
}
