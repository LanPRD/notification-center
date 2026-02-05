import { GetLogsByNotificationIdUseCase } from "@/application/use-cases/notifications/get-logs-by-notification-id";
import { Controller, Get, HttpCode, Param, UsePipes } from "@nestjs/common";
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { ZodValidationPipe } from "nestjs-zod";
import { BaseErrorResponseDto } from "../dtos/error-response.dto";
import {
  getNotificationByIdSchema,
  GetNotificationResponseDto
} from "../dtos/get-notification-by-id.dto";
import { NotificationLogPresenter } from "../presenters/notification-presenter copy";

@Controller()
@ApiTags("Notifications")
export class GetLogsByNotificationIdController {
  constructor(private readonly useCase: GetLogsByNotificationIdUseCase) {}

  @Get("/notifications/:id")
  @HttpCode(200)
  @ApiOkResponse({ type: GetNotificationResponseDto })
  @ApiNotFoundResponse({ type: BaseErrorResponseDto })
  @UsePipes(new ZodValidationPipe(getNotificationByIdSchema))
  async handle(@Param("notificationId") notificationId: string) {
    const result = await this.useCase.execute(notificationId);
    return result.map(NotificationLogPresenter.toHTTP);
  }
}
