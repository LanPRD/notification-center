import type { IdempotencyKey } from "@/domain/entities/idempotency-key";
import type { IdempotencyKeyRepository } from "@/domain/repositories/idempotency-key-repository";
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaIdempotencyKeyMapper } from "../mappers/prisma-idempotency-key-mapper";
import { PrismaService } from "../prisma/prisma.service";

// prisma-idempotency-key-repository.ts
@Injectable()
export class PrismaIdempotencyKeyRepository implements IdempotencyKeyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByKey(
    idempotencyKey: string,
    tx?: unknown
  ): Promise<IdempotencyKey | null> {
    const db = (tx ?? this.prisma) as Prisma.TransactionClient | PrismaService;

    const ik = await db.idempotencyKey.findUnique({
      where: { key: idempotencyKey }
    });

    return ik ? PrismaIdempotencyKeyMapper.toDomain(ik) : null;
  }

  async create(
    idempotencyKey: IdempotencyKey,
    tx?: unknown
  ): Promise<IdempotencyKey> {
    const db = (tx ?? this.prisma) as Prisma.TransactionClient | PrismaService;

    const created = await db.idempotencyKey.create({
      data: PrismaIdempotencyKeyMapper.toPrisma(idempotencyKey)
    });

    return PrismaIdempotencyKeyMapper.toDomain(created);
  }

  async update(
    key: string,
    data: { responseStatus: number; responseBody: any },
    tx?: unknown
  ): Promise<void> {
    const db = (tx ?? this.prisma) as Prisma.TransactionClient | PrismaService;

    await db.idempotencyKey.update({
      where: { key },
      data: {
        responseStatus: data.responseStatus,
        responseBody: data.responseBody
      }
    });
  }
}
