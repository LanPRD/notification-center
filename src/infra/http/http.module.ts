import { CancelNotificationUseCase } from "@/application/use-cases/notifications/cancel-notification";
import { CreateNotificationUseCase } from "@/application/use-cases/notifications/create-notification";
import { GetNotificationByIdUseCase } from "@/application/use-cases/notifications/get-notification-by-id";
import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { MessagingModule } from "../messaging/messaging.module";
import { CancelNotificationController } from "./controllers/cancel-notification.controller";
import { CreateNotificationController } from "./controllers/create-notification.controller";
import { CreateUserController } from "./controllers/create-user.controller";
import { GetNotificationByIdController } from "./controllers/get-notification-by-id.controller";

@Module({
  imports: [DatabaseModule, MessagingModule],
  controllers: [
    CreateNotificationController,
    GetNotificationByIdController,
    CreateUserController,
    CancelNotificationController
  ],
  providers: [
    CreateNotificationUseCase,
    GetNotificationByIdUseCase,
    CancelNotificationUseCase
  ]
})
export class HttpModule {}
