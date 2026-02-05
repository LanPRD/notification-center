import type { NotificationLog } from "@/domain/entities/notification-log";
import type { NotificationLogRepository } from "@/domain/repositories/notification-log-repository";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { PrismaNotificationLogMapper } from "../mappers/prisma-notification-log-mapper";

@Injectable()
export class PrismaNotificationLogRepository implements NotificationLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(log: NotificationLog): Promise<void> {
    await this.prisma.notificationLog.create({
      data: PrismaNotificationLogMapper.toPrisma(log)
    });
  }
}
