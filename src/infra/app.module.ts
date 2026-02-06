import { Module } from "@nestjs/common";
import { EnvModule } from "./env/env.module";
import { EnvService } from "./env/env.service";
import { HttpModule } from "./http/http.module";
import { MessagingModule } from "./messaging/messaging.module";
import { WebhooksModule } from "./webhooks/webhooks.module";

@Module({
  imports: [HttpModule, EnvModule, MessagingModule, WebhooksModule],
  providers: [EnvService]
})
export class AppModule {}
