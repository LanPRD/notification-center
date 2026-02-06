import { ProcessSendGridWebhookUseCase } from "@/application/use-cases/webhooks/process-sendgrid-webhook";
import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { EnvModule } from "../env/env.module";
import { MessagingModule } from "../messaging/messaging.module";
import { SendGridWebhookController } from "./controllers/sendgrid-webhook.controller";
import { SendGridSignatureGuard } from "./guards/sendgrid-signature.guard";

@Module({
  imports: [DatabaseModule, EnvModule, MessagingModule],
  controllers: [SendGridWebhookController],
  providers: [ProcessSendGridWebhookUseCase, SendGridSignatureGuard]
})
export class WebhooksModule {}
