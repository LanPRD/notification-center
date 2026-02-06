import type { NotificationDetails } from "@/domain/types/notification-details";
import type { Notification } from "@/domain/entities/notification";
import type { NotificationStatus } from "@/domain/enums/notification-status";
import type { NotificationRepository } from "@/domain/repositories/notification-repository";
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaNotificationMapper } from "../mappers/prisma-notification-mapper";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PrismaNotificationRepository implements NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAllWithDetails(): Promise<NotificationDetails[]> {
    const notifications = await this.prisma.notification.findMany({
      include: { user: true, logs: true },
      orderBy: { createdAt: "desc" }
    });

    return notifications.map(PrismaNotificationMapper.toDetails);
  }

  async updateStatus(id: string, status: NotificationStatus): Promise<void> {
    await this.prisma.notification.update({
      where: { id: id },
      data: { status: status }
    });
  }

  async findByUserAndExternalId(
    userId: string,
    externalId: string,
    tx?: unknown
  ): Promise<Notification | null> {
    const db = (tx ?? this.prisma) as Prisma.TransactionClient | PrismaService;

    const notification = await db.notification.findUnique({
      where: {
        userId_externalId: {
          userId: userId,
          externalId: externalId
        }
      }
    });

    if (!notification) return null;

    return PrismaNotificationMapper.toDomain(notification);
  }

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

  async create(
    notification: Notification,
    tx?: Prisma.TransactionClient
  ): Promise<Notification> {
    const db = tx ?? this.prisma;

    const created = await db.notification.create({
      data: PrismaNotificationMapper.toPrisma(notification)
    });

    return PrismaNotificationMapper.toDomain(created);
  }
}
