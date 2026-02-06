import { CancelNotificationUseCase } from "@/application/use-cases/notifications/cancel-notification";
import { CreateNotificationUseCase } from "@/application/use-cases/notifications/create-notification";
import { GetAllNotificationsByUserIdUseCase } from "@/application/use-cases/notifications/get-all-notifications";
import { GetLogsByNotificationIdUseCase } from "@/application/use-cases/notifications/get-logs-by-notification-id";
import { GetNotificationByIdUseCase } from "@/application/use-cases/notifications/get-notification-by-id";
import { CreateUserUseCase } from "@/application/use-cases/users/create-user";
import { GetUserPreferenceByUserIdUseCase } from "@/application/use-cases/users/get-user-preference-by-user-id";
import { UpdateUserPreferencesUseCase } from "@/application/use-cases/users/update-user-preferences";
import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { MessagingModule } from "../messaging/messaging.module";
import { CancelNotificationController } from "./controllers/notifications/cancel-notification.controller";
import { CreateNotificationController } from "./controllers/notifications/create-notification.controller";
import { GetAllNotificationsByUserIdController } from "./controllers/notifications/get-all-notifications.controller";
import { GetLogsByNotificationIdController } from "./controllers/notifications/get-logs-by-notification-id.controller";
import { GetNotificationByIdController } from "./controllers/notifications/get-notification-by-id.controller";
import { CreateUserController } from "./controllers/users/create-user.controller";
import { GetUserPreferenceByUserIdController } from "./controllers/users/get-user-preferences-by-user-id.controller";
import { UpdateUserPreferencesController } from "./controllers/users/update-user-preferences.controller";

@Module({
  imports: [DatabaseModule, MessagingModule],
  controllers: [
    CancelNotificationController,
    CreateNotificationController,
    GetAllNotificationsByUserIdController,
    GetLogsByNotificationIdController,
    GetNotificationByIdController,
    CreateUserController,
    GetUserPreferenceByUserIdController,
    UpdateUserPreferencesController
  ],
  providers: [
    CancelNotificationUseCase,
    CreateNotificationUseCase,
    GetAllNotificationsByUserIdUseCase,
    GetLogsByNotificationIdUseCase,
    GetNotificationByIdUseCase,
    CreateUserUseCase,
    GetUserPreferenceByUserIdUseCase,
    UpdateUserPreferencesUseCase
  ]
})
export class HttpModule {}
