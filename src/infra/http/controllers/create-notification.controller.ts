import { CreateNotificationUseCase } from "@/application/use-cases/notifications/create-notification";
import {
  createNotificationBodySchema,
  CreateNotificationDto
} from "@/infra/http/dtos/create-notification.dto";
import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  UsePipes
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiHeader,
  ApiTags
} from "@nestjs/swagger";
import { ZodValidationPipe } from "nestjs-zod";
import { BaseErrorResponseDto } from "../dtos/error-response.dto";
import { NotificationPresenter } from "../presenters/notification-presenter";

@Controller("/notifications")
@ApiTags("Notifications")
export class CreateNotificationController {
  constructor(private readonly useCase: CreateNotificationUseCase) {}

  @Post()
  @HttpCode(201)
  @ApiBody({ type: CreateNotificationDto })
  @ApiHeader({
    name: "Idempotency-Key",
    required: true,
    schema: {
      type: "string",
      format: "uuid"
    }
  })
  @ApiCreatedResponse({ type: CreateNotificationDto })
  @ApiConflictResponse({ type: BaseErrorResponseDto })
  @ApiBadRequestResponse({ type: BaseErrorResponseDto })
  @UsePipes(new ZodValidationPipe(createNotificationBodySchema))
  async handle(@Headers() rawHeader: any, @Body() body: CreateNotificationDto) {
    const result = await this.useCase.execute({ input: body, rawHeader });

    if (result.isLeft()) {
      console.log(result.value);
      throw result.value;
    }

    return NotificationPresenter.toHTTP(result.value.notification);
  }
}
