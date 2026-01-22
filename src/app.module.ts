import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CreateNotificationController } from "./notifications/controllers/create-notification.controller";
import { PrismaService } from "./prisma/prisma.service";
import { CreateUserController } from "./users/controllers/create-user.controller";
import { envSchema } from "./env";

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: env => envSchema.parse(env),
      isGlobal: true
    })
  ],
  controllers: [CreateNotificationController, CreateUserController],
  providers: [PrismaService]
})
export class AppModule {}
