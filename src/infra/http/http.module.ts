import { CancelNotificationUseCase } from "@/application/use-cases/notifications/cancel-notification";
import { CreateNotificationUseCase } from "@/application/use-cases/notifications/create-notification";
import { GetAllNotificationsByUserIdUseCase } from "@/application/use-cases/notifications/get-all-notifications";
import { GetLogsByNotificationIdUseCase } from "@/application/use-cases/notifications/get-logs-by-notification-id";
import { GetNotificationByIdUseCase } from "@/application/use-cases/notifications/get-notification-by-id";
import { CreateUserUseCase } from "@/application/use-cases/users/create-user";
import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { MessagingModule } from "../messaging/messaging.module";
import { CancelNotificationController } from "./controllers/cancel-notification.controller";
import { CreateNotificationController } from "./controllers/create-notification.controller";
import { CreateUserController } from "./controllers/create-user.controller";
import { GetAllNotificationsByUserIdController } from "./controllers/get-all-notifications.controller";
import { GetLogsByNotificationIdController } from "./controllers/get-logs-by-notification-id.controller";
import { GetNotificationByIdController } from "./controllers/get-notification-by-id.controller";

@Module({
  imports: [DatabaseModule, MessagingModule],
  controllers: [
    CancelNotificationController,
    CreateNotificationController,
    CreateUserController,
    GetAllNotificationsByUserIdController,
    GetLogsByNotificationIdController,
    GetNotificationByIdController
  ],
  providers: [
    CancelNotificationUseCase,
    CreateNotificationUseCase,
    CreateUserUseCase,
    GetAllNotificationsByUserIdUseCase,
    GetLogsByNotificationIdUseCase,
    GetNotificationByIdUseCase
  ]
})
export class HttpModule {}
