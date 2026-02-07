import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { NotificationLog } from "@/domain/entities/notification-log";
import type { NotificationLogStatus } from "@/domain/enums/notification-log-status";
import type {
  Prisma,
  NotificationLog as PrismaNotificationLog
} from "@prisma/client";

export class PrismaNotificationLogMapper {
  static toDomain(raw: PrismaNotificationLog): NotificationLog {
    return NotificationLog.create(
      {
        channel: raw.channel,
        status: raw.status as NotificationLogStatus,
        errorMessage: raw.errorMessage,
        sentAt: raw.sentAt,
        notificationId: new UniqueEntityID(raw.notificationId)
      },
      new UniqueEntityID(raw.id)
    );
  }

  static toPrisma(
    log: NotificationLog
  ): Prisma.NotificationLogUncheckedCreateInput {
    return {
      id: log.id.toString(),
      channel: log.channel,
      status: log.status,
      errorMessage: log.errorMessage,
      sentAt: log.sentAt,
      notificationId: log.notificationId.toString()
    };
  }
}
