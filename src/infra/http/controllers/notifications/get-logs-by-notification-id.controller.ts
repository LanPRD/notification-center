import { GetLogsByNotificationIdUseCase } from "@/application/use-cases/notifications/get-logs-by-notification-id";
import { Controller, Get, HttpCode, Param } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags
} from "@nestjs/swagger";
import { ZodValidationPipe } from "nestjs-zod";
import { BaseErrorResponseDto } from "../../dtos/error-response.dto";
import {
  GetLogsByNotificationIdParamDto,
  getLogsByNotificationIdParamSchema,
  GetLogsByNotificationIdResponseDto
} from "../../dtos/get-logs-by-notification-id.dto";
import { NotificationLogPresenter } from "../../presenters/notification-log-presenter";

@Controller()
@ApiTags("Notifications")
export class GetLogsByNotificationIdController {
  constructor(private readonly useCase: GetLogsByNotificationIdUseCase) {}

  @Get("/notifications/:notificationId/logs")
  @HttpCode(200)
  @ApiOperation({
    summary: "Get all logs for a notification",
    description:
      "Retrieves the delivery logs for a specific notification. Logs include delivery attempts, status changes, and any error messages from the delivery process."
  })
  @ApiParam({
    name: "notificationId",
    type: "string",
    format: "uuid",
    description: "The notification ID"
  })
  @ApiOkResponse({
    description: "Logs retrieved successfully",
    type: [GetLogsByNotificationIdResponseDto]
  })
  @ApiBadRequestResponse({
    description: "Invalid notification ID format",
    type: BaseErrorResponseDto
  })
  async handle(
    @Param(new ZodValidationPipe(getLogsByNotificationIdParamSchema))
    params: GetLogsByNotificationIdParamDto
  ) {
    const result = await this.useCase.execute(params.notificationId);
    return result.map(NotificationLogPresenter.toHTTP);
  }
}
