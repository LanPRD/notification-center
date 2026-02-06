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
  ApiBody,
  ApiHeader,
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
      "Webhook endpoint that receives email delivery events from SendGrid. Events include: delivered, bounced, opened, clicked, spam reports, and unsubscribes. The endpoint validates the webhook signature before processing."
  })
  @ApiHeader({
    name: "x-twilio-email-event-webhook-signature",
    required: true,
    description: "ECDSA signature for webhook payload verification"
  })
  @ApiHeader({
    name: "x-twilio-email-event-webhook-timestamp",
    required: true,
    description: "Timestamp used in signature generation"
  })
  @ApiBody({
    type: SendGridWebhookBodyDto,
    description: "Array of SendGrid event objects",
    examples: {
      delivered: {
        summary: "Email delivered event",
        value: [
          {
            email: "user@example.com",
            timestamp: 1234567890,
            event: "delivered",
            sg_message_id: "abc123",
            notification_id: "550e8400-e29b-41d4-a716-446655440000"
          }
        ]
      },
      bounce: {
        summary: "Email bounced event",
        value: [
          {
            email: "user@example.com",
            timestamp: 1234567890,
            event: "bounce",
            reason: "550 User not found",
            notification_id: "550e8400-e29b-41d4-a716-446655440000"
          }
        ]
      }
    }
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
