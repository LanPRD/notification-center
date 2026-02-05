import type { NotificationLog } from "@/domain/entities/notification-log";
import type { NotificationLogRepository } from "@/domain/repositories/notification-log-repository";
import { Injectable } from "@nestjs/common";
import { PrismaNotificationLogMapper } from "../mappers/prisma-notification-log-mapper";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PrismaNotificationLogRepository implements NotificationLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMany(logs: NotificationLog[]): Promise<void> {
    await this.prisma.notificationLog.createMany({
      data: logs.map(PrismaNotificationLogMapper.toPrisma)
    });
  }

  async create(log: NotificationLog): Promise<void> {
    await this.prisma.notificationLog.create({
      data: PrismaNotificationLogMapper.toPrisma(log)
    });
  }

  async getByNotificationId(
    notificationId: string
  ): Promise<NotificationLog[]> {
    const logs = await this.prisma.notificationLog.findMany({
      where: { notificationId }
    });

    return logs.map(PrismaNotificationLogMapper.toDomain);
  }
}
