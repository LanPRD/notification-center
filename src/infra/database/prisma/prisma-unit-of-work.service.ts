import type { UnitOfWork } from "@/domain/repositories/unit-of-work";
import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "./prisma.service";

@Injectable()
export class PrismaUnitOfWorkService implements UnitOfWork<Prisma.TransactionClient> {
  constructor(private readonly prisma: PrismaService) {}

  run<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(fn);
  }
}
