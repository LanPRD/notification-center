import { IdempotencyKey } from "@/domain/entities/idempotency-key";
import type {
  Prisma,
  IdempotencyKey as PrismaIdempotencyKey
} from "@prisma/client";

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

  static toPrisma(
    idempotencyKey: IdempotencyKey
  ): Prisma.IdempotencyKeyUncheckedCreateInput {
    return {
      key: idempotencyKey.key,
      expiresAt: idempotencyKey.expiresAt,
      createdAt: idempotencyKey.createdAt!,
      responseBody: JSON.stringify(idempotencyKey.responseBody),
      responseStatus: idempotencyKey.responseStatus
    };
  }
}
