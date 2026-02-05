import { IdempotencyKey } from "@/domain/entities/idempotency-key";
import type {
  IdempotencyKey as PrismaIdempotencyKey,
  Notification as PrismaNotification
} from "@prisma/client";
import { Prisma } from "@prisma/client";
import { PrismaNotificationMapper } from "./prisma-notification-mapper";

export class PrismaIdempotencyKeyMapper {
  static toDomain(raw: PrismaIdempotencyKey): IdempotencyKey {
    return IdempotencyKey.create({
      key: raw.key,
      responseStatus: raw.responseStatus,
      responseBody:
        raw.responseBody ?
          PrismaNotificationMapper.toDomain(
            raw.responseBody as unknown as PrismaNotification
          )
        : null,
      createdAt: raw.createdAt,
      expiresAt: raw.expiresAt
    });
  }

  static toPrisma(
    idempotencyKey: IdempotencyKey
  ): Prisma.IdempotencyKeyUncheckedCreateInput {
    return {
      key: idempotencyKey.key,
      expiresAt: idempotencyKey.expiresAt,
      createdAt: idempotencyKey.createdAt!,
      responseBody:
        idempotencyKey.responseBody ?
          PrismaNotificationMapper.toJSON(idempotencyKey.responseBody)
        : Prisma.JsonNull,
      responseStatus: idempotencyKey.responseStatus
    };
  }
}
