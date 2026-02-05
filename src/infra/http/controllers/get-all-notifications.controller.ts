import { GetAllNotificationsByUserIdUseCase } from "@/application/use-cases/notifications/get-all-notifications";
import { Controller, Get, HttpCode } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { NotificationDetailsResponseDto } from "../dtos/get-all-notifications.dto";
import { NotificationPresenter } from "../presenters/notification-presenter";

@Controller()
@ApiTags("Notifications")
export class GetAllNotificationsByUserIdController {
  constructor(private readonly useCase: GetAllNotificationsByUserIdUseCase) {}

  @Get("/notifications")
  @HttpCode(200)
  @ApiOperation({ summary: "Get all notifications with user and logs details" })
  @ApiOkResponse({
    description: "Notifications retrieved successfully",
    type: [NotificationDetailsResponseDto]
  })
  async handle() {
    const result = await this.useCase.execute();
    return result.map(NotificationPresenter.toHTTPWithDetails);
  }
}
