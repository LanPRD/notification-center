import { IdempotencyKey } from "@/domain/entities/idempotency-key";
import type { IdempotencyKey as PrismaIdempotencyKey } from "@prisma/client";

export class PrismaIdempotencyKeyMapper {
  static toDomain(raw: PrismaIdempotencyKey): IdempotencyKey {
    return IdempotencyKey.create({
      key: raw.key,
      expiresAt: raw.expiresAt,
      createdAt: raw.createdAt,
      responseBody: JSON.parse(raw.responseBody as string),
      responseStatus: raw.responseStatus
    });
  }
}
