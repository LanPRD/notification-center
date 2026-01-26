import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { CreateNotificationController } from "./controllers/create-notification.controller";
import { CreateUserController } from "./controllers/create-user.controller";

@Module({
  imports: [DatabaseModule],
  controllers: [CreateNotificationController, CreateUserController]
})
export class HttpModule {}
