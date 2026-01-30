import type { Notification } from "@/domain/entities/notification";
import type { NotificationRepository } from "@/domain/repositories/notification-repository";
import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaNotificationMapper } from "../mappers/prisma-notification-mapper";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PrismaNotificationRepository implements NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async update(notification: Notification): Promise<void> {
    await this.prisma.notification.update({
      where: { id: notification.id.toString() },
      data: PrismaNotificationMapper.toPrisma(notification)
    });
  }

  async findById(id: string): Promise<Notification | null> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: id }
    });

    if (!notification) return null;

    return PrismaNotificationMapper.toDomain(notification);
  }

  async findByExternalId(externalId: string): Promise<Notification | null> {
    const notification = await this.prisma.notification.findUnique({
      where: { externalId: externalId }
    });

    if (!notification) return null;

    return PrismaNotificationMapper.toDomain(notification);
  }

  async create(notification: Notification, tx?: unknown): Promise<void> {
    const db = (tx ?? this.prisma) as Prisma.TransactionClient | PrismaService;

    await db.notification.create({
      data: PrismaNotificationMapper.toPrisma(notification)
    });
  }
}
