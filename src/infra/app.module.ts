import { Module } from "@nestjs/common";
import { EnvModule } from "./env/env.module";
import { EnvService } from "./env/env.service";
import { HttpModule } from "./http/http.module";
import { MessagingModule } from "./messaging/messaging.module";

@Module({
  imports: [HttpModule, EnvModule, MessagingModule],
  providers: [EnvService]
})
export class AppModule {}
