import { CreateNotificationUseCase } from "@/application/use-cases/notifications/create-notification";
import { GetNotificationByIdUseCase } from "@/application/use-cases/notifications/get-notification-by-id";
import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { CreateNotificationController } from "./controllers/create-notification.controller";
import { CreateUserController } from "./controllers/create-user.controller";
import { GetNotificationByIdController } from "./controllers/get-notification-by-id.controller";

@Module({
  imports: [DatabaseModule],
  controllers: [
    CreateNotificationController,
    GetNotificationByIdController,
    CreateUserController
  ],
  providers: [CreateNotificationUseCase, GetNotificationByIdUseCase]
})
export class HttpModule {}
