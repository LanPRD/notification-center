import type { IdempotencyKey } from "@/domain/entities/idempotency-key";
import type { IdempotencyKeyRepository } from "@/domain/repositories/idempotency-key-repository";
import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaIdempotencyKeyMapper } from "../mappers/prisma-idempotency-key-mapper";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PrismaIdempotencyKeyRepository implements IdempotencyKeyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByKey(idempotencyKey: string): Promise<IdempotencyKey | null> {
    const ik = await this.prisma.idempotencyKey.findUnique({
      where: { key: idempotencyKey }
    });

    return ik ? PrismaIdempotencyKeyMapper.toDomain(ik) : null;
  }

  async create(idempotencyKey: IdempotencyKey, tx?: unknown): Promise<void> {
    const db = (tx ?? this.prisma) as Prisma.TransactionClient | PrismaService;

    await db.idempotencyKey.create({
      data: PrismaIdempotencyKeyMapper.toPrisma(idempotencyKey)
    });
  }
}
