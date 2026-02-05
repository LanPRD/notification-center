import { CreateNotificationUseCase } from "@/application/use-cases/notifications/create-notification";
import { Body, Controller, Headers, HttpCode, Post } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags
} from "@nestjs/swagger";
import { ZodValidationPipe } from "nestjs-zod";
import { BaseErrorResponseDto } from "../dtos/error-response.dto";
import {
  CreateNotificationBodyDto,
  createNotificationBodySchema,
  NotificationResponseDto
} from "../dtos/notification.dto";
import { NotificationPresenter } from "../presenters/notification-presenter";

@Controller("/notifications")
@ApiTags("Notifications")
export class CreateNotificationController {
  constructor(private readonly useCase: CreateNotificationUseCase) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: "Create a new notification" })
  @ApiHeader({
    name: "Idempotency-Key",
    required: true,
    description: "Unique key to ensure idempotent requests",
    schema: { type: "string", format: "uuid" }
  })
  @ApiBody({ type: CreateNotificationBodyDto })
  @ApiCreatedResponse({
    description: "Notification created successfully",
    type: NotificationResponseDto
  })
  @ApiBadRequestResponse({
    description: "Invalid request body or missing idempotency key",
    type: BaseErrorResponseDto
  })
  @ApiNotFoundResponse({
    description: "User not found",
    type: BaseErrorResponseDto
  })
  @ApiConflictResponse({
    description: "Request is being processed (idempotency conflict)",
    type: BaseErrorResponseDto
  })
  async handle(
    @Headers() rawHeader: Record<string, string>,
    @Body(new ZodValidationPipe(createNotificationBodySchema))
    body: CreateNotificationBodyDto
  ) {
    const result = await this.useCase.execute({ input: body, rawHeader });

    if (result.isLeft()) {
      throw result.value;
    }

    return NotificationPresenter.toHTTP(result.value.notification);
  }
}
