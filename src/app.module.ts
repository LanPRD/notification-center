import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CreateNotificationController } from "./controllers/create-notification.controller";
import { CreateUserController } from "./controllers/create-user.controller";
import { PrismaService } from "./prisma/prisma.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true // .env
    })
  ],
  controllers: [CreateNotificationController, CreateUserController],
  providers: [PrismaService]
})
export class AppModule {}
