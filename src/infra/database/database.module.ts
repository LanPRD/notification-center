import { IdempotencyKeyRepository } from "@/domain/repositories/idempotency-key-repository";
import { NotificationRepository } from "@/domain/repositories/notification-repository";
import { UnitOfWork } from "@/domain/repositories/unit-of-work";
import { UserRepository } from "@/domain/repositories/user-repository";
import { Module } from "@nestjs/common";
import { EnvModule } from "../env/env.module";
import { PrismaUnitOfWorkService } from "./prisma/prisma-unit-of-work.service";
import { PrismaService } from "./prisma/prisma.service";
import { PrismaIdempotencyKeyRepository } from "./repositories/prisma-idempotency-key-repository";
import { PrismaNotificationRepository } from "./repositories/prisma-notification-repository";
import { PrismaUserPreferenceRepository } from "./repositories/prisma-user-preference-repository";
import { PrismaUserRepository } from "./repositories/prisma-user-repository";

@Module({
  imports: [EnvModule],
  providers: [
    PrismaService,
    {
      provide: UnitOfWork,
      useClass: PrismaUnitOfWorkService
    },
    {
      provide: IdempotencyKeyRepository,
      useClass: PrismaIdempotencyKeyRepository
    },
    {
      provide: NotificationRepository,
      useClass: PrismaNotificationRepository
    },
    PrismaUserPreferenceRepository,
    {
      provide: UserRepository,
      useClass: PrismaUserRepository
    }
  ],
  exports: [
    PrismaService,
    UnitOfWork,
    IdempotencyKeyRepository,
    NotificationRepository,
    PrismaUserPreferenceRepository,
    UserRepository
  ]
})
export class DatabaseModule {}
