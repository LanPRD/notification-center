import { ProcessSendGridWebhookUseCase } from "@/application/use-cases/webhooks/process-sendgrid-webhook";
import {
  Body,
  Controller,
  HttpCode,
  Logger,
  Post,
  UseGuards
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse
} from "@nestjs/swagger";
import { ZodValidationPipe } from "nestjs-zod";
import { BaseErrorResponseDto } from "../../http/dtos/error-response.dto";
import {
  SendGridWebhookBodyDto,
  sendGridWebhookBodySchema
} from "../dtos/sendgrid-webhook.dto";
import { SendGridSignatureGuard } from "../guards/sendgrid-signature.guard";

// https://docs.sendgrid.com/for-developers/tracking-events/event
@Controller()
@ApiTags("Webhooks")
export class SendGridWebhookController {
  private readonly logger = new Logger(SendGridWebhookController.name);

  constructor(private readonly useCase: ProcessSendGridWebhookUseCase) {}

  @Post("/webhooks/sendgrid")
  @HttpCode(200)
  @UseGuards(SendGridSignatureGuard)
  @ApiOperation({
    summary: "Receive SendGrid email events",
    description:
      "Webhook endpoint that receives email delivery events from SendGrid (delivered, bounced, opened, etc.)"
  })
  @ApiOkResponse({
    description: "Events processed successfully",
    schema: {
      type: "object",
      properties: {
        processed: { type: "number", example: 5 },
        skipped: { type: "number", example: 2 }
      }
    }
  })
  @ApiBadRequestResponse({
    description: "Invalid webhook payload",
    type: BaseErrorResponseDto
  })
  @ApiUnauthorizedResponse({
    description: "Invalid webhook signature",
    type: BaseErrorResponseDto
  })
  async handle(
    @Body(new ZodValidationPipe(sendGridWebhookBodySchema))
    body: SendGridWebhookBodyDto
  ) {
    this.logger.log(`Received ${body.length} events from SendGrid`);

    const events = body.map(event => ({
      email: event.email,
      event: event.event,
      notificationId: event.notification_id,
      reason: event.reason,
      timestamp: event.timestamp
    }));

    const result = await this.useCase.execute({ events });

    if (result.isLeft()) {
      throw result.value;
    }

    return {
      processed: result.value.processedCount,
      skipped: result.value.skippedCount
    };
  }
}
