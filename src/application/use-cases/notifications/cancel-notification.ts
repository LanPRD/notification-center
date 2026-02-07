import { ConflictException } from "@/application/errors/conflict-exception";
import { InternalException } from "@/application/errors/internal-exception";
import { NotFoundException } from "@/application/errors/not-found-exception";
import { left, right, type Either } from "@/core/either";
import { NotificationStatus } from "@/domain/enums/notification-status";
import { NotificationRepository } from "@/domain/repositories/notification-repository";
import { EventsService, MESSAGE_PATTERNS } from "@/infra/messaging";
import { Injectable, Logger } from "@nestjs/common";

type CancelNotificationUseCaseResponse = Either<
  NotFoundException | ConflictException | InternalException,
  {
    id: string;
    status: "CANCELED";
    canceledAt: Date;
  }
>;

@Injectable()
export class CancelNotificationUseCase {
  private readonly logger = new Logger(CancelNotificationUseCase.name);

  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly eventsService: EventsService
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

    try {
      await this.notificationRepository.update(notification);
    } catch (_error) {
      return left(
        new InternalException({ message: "Failed to cancel notification" })
      );
    }

    await this.eventsService
      .emitLow(
        MESSAGE_PATTERNS.NOTIFICATION_CANCELED,
        notification.id.toString()
      )
      .catch(
        _err => {}
        // this.logger.error("Failed to emit notification canceled event", err)
      );

    return right({
      id: notification.id.toString(),
      status: notification.status,
      canceledAt: new Date()
    });
  }
}
