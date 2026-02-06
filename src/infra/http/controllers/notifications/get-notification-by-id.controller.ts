import { GetNotificationByIdUseCase } from "@/application/use-cases/notifications/get-notification-by-id";
import { Controller, Get, HttpCode, Param } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags
} from "@nestjs/swagger";
import { ZodValidationPipe } from "nestjs-zod";
import { BaseErrorResponseDto } from "../../dtos/error-response.dto";
import {
  GetNotificationByIdParamDto,
  getNotificationByIdParamSchema,
  GetNotificationByIdResponseDto
} from "../../dtos/get-notification-by-id.dto";
import { NotificationPresenter } from "../../presenters/notification-presenter";

@Controller()
@ApiTags("Notifications")
export class GetNotificationByIdController {
  constructor(private readonly useCase: GetNotificationByIdUseCase) {}

  @Get("/notifications/:id")
  @HttpCode(200)
  @ApiOperation({
    summary: "Get a notification by ID",
    description:
      "Retrieves a single notification by its unique identifier. Returns the notification details including status, content, and metadata."
  })
  @ApiParam({
    name: "id",
    type: "string",
    format: "uuid",
    description: "The notification ID"
  })
  @ApiOkResponse({
    description: "Notification retrieved successfully",
    type: GetNotificationByIdResponseDto
  })
  @ApiBadRequestResponse({
    description: "Invalid notification ID format",
    type: BaseErrorResponseDto
  })
  @ApiNotFoundResponse({
    description: "Notification not found",
    type: BaseErrorResponseDto
  })
  async handle(
    @Param(new ZodValidationPipe(getNotificationByIdParamSchema))
    params: GetNotificationByIdParamDto
  ) {
    const result = await this.useCase.execute(params.id);

    if (result.isLeft()) {
      throw result.value;
    }

    return NotificationPresenter.toHTTP(result.value.notification);
  }
}
