import { GetAllNotificationsByUserIdUseCase } from "@/application/use-cases/notifications/get-all-notifications-by-user-id";
import { Controller, Get, HttpCode, UsePipes } from "@nestjs/common";
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { ZodValidationPipe } from "nestjs-zod";
import { BaseErrorResponseDto } from "../dtos/error-response.dto";
import {
  getNotificationByIdSchema,
  GetNotificationResponseDto
} from "../dtos/get-notification-by-id.dto";
import { NotificationPresenter } from "../presenters/notification-presenter";

@Controller()
@ApiTags("Notifications")
export class GetAllNotificationsByUserIdController {
  constructor(private readonly useCase: GetAllNotificationsByUserIdUseCase) {}

  @Get("/notifications")
  @HttpCode(200)
  @ApiOkResponse({ type: GetNotificationResponseDto })
  @ApiNotFoundResponse({ type: BaseErrorResponseDto })
  @UsePipes(new ZodValidationPipe(getNotificationByIdSchema))
  async handle() {
    const result = await this.useCase.execute();

    if (result.isLeft()) {
      console.log(result.value);
      throw result.value;
    }

    return result.value.notifications.map(
      NotificationPresenter.toHTTPWithDetails
    );
  }
}
