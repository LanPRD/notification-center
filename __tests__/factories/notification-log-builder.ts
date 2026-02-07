import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { NotificationLog } from "@/domain/entities/notification-log";
import { NotificationLogStatus } from "@/domain/enums/notification-log-status";
import { PrismaNotificationLogMapper } from "@/infra/database/mappers/prisma-notification-log-mapper";
import { PrismaService } from "@/infra/database/prisma/prisma.service";
import { faker } from "@faker-js/faker";
import { Injectable } from "@nestjs/common";

export class NotificationLogFactory {
  static buildSuccess(
    notificationId: UniqueEntityID,
    overrides: Partial<NotificationLog> = {},
    id?: UniqueEntityID
  ) {
    return NotificationLog.create(
      {
        channel: faker.lorem.word(),
        errorMessage: null,
        status: NotificationLogStatus.SUCCESS,
        ...overrides,
        notificationId: notificationId
      },
      id ?? new UniqueEntityID()
    );
  }

  static buildFailed(
    notificationId: UniqueEntityID,
    overrides: Partial<NotificationLog> = {},
    id?: UniqueEntityID
  ) {
    return NotificationLog.create(
      {
        channel: faker.lorem.word(),
        errorMessage: faker.lorem.sentence(),
        status: NotificationLogStatus.FAILED,
        ...overrides,
        notificationId: notificationId
      },
      id ?? new UniqueEntityID()
    );
  }
}

@Injectable()
export class PrismaNotificationLogFactory {
  constructor(private readonly prisma: PrismaService) {}

  async buildSuccessLog(
    notificationId: UniqueEntityID,
    data: Partial<NotificationLog> = {},
    id?: UniqueEntityID
  ): Promise<NotificationLog> {
    const notificationLog = NotificationLogFactory.buildSuccess(
      notificationId,
      data,
      id
    );

    await this.prisma.notificationLog.create({
      data: PrismaNotificationLogMapper.toPrisma(notificationLog)
    });

    return notificationLog;
  }
}
