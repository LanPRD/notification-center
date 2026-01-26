import { Module } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";
import { PrismaIdempotencyKeyRepository } from "./repositories/prisma-idempotency-key-repository";
import { PrismaNotificationRepository } from "./repositories/prisma-notification-repository";
import { PrismaUserPreferenceRepository } from "./repositories/prisma-user-preference-repository";
import { PrismaUserRepository } from "./repositories/prisma-user-repository";

@Module({
  providers: [
    PrismaService,
    PrismaIdempotencyKeyRepository,
    PrismaNotificationRepository,
    PrismaUserPreferenceRepository,
    PrismaUserRepository
  ],
  exports: [
    PrismaService,
    PrismaIdempotencyKeyRepository,
    PrismaNotificationRepository,
    PrismaUserPreferenceRepository,
    PrismaUserRepository
  ]
})
export class DatabaseModule {}
