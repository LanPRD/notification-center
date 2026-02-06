import { CancelNotificationUseCase } from "@/application/use-cases/notifications/cancel-notification";
import { Controller, HttpCode, Param, Patch } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiInternalServerErrorResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiTags
} from "@nestjs/swagger";
import { ZodValidationPipe } from "nestjs-zod";
import {
  CancelNotificationParamDto,
  cancelNotificationParamSchema,
  CancelNotificationResponseDto
} from "../../dtos/cancel-notification.dto";
import { BaseErrorResponseDto } from "../../dtos/error-response.dto";

@Controller()
@ApiTags("Notifications")
export class CancelNotificationController {
  constructor(private readonly useCase: CancelNotificationUseCase) {}

  @Patch("/notifications/:id/cancel")
  @HttpCode(204)
  @ApiOperation({
    summary: "Cancel a pending notification",
    description:
      "Cancels a notification that is still in PENDING status. Once a notification has been sent or is being processed, it cannot be canceled."
  })
  @ApiParam({
    name: "id",
    type: "string",
    format: "uuid",
    description: "The notification ID"
  })
  @ApiNoContentResponse({
    description: "Notification canceled successfully",
    type: CancelNotificationResponseDto
  })
  @ApiBadRequestResponse({
    description: "Invalid notification ID format",
    type: BaseErrorResponseDto
  })
  @ApiNotFoundResponse({
    description: "Notification not found",
    type: BaseErrorResponseDto
  })
  @ApiConflictResponse({
    description: "Notification is not in PENDING state",
    type: BaseErrorResponseDto
  })
  @ApiInternalServerErrorResponse({
    description: "Failed to create notification",
    type: BaseErrorResponseDto
  })
  async handle(
    @Param(new ZodValidationPipe(cancelNotificationParamSchema))
    params: CancelNotificationParamDto
  ) {
    const result = await this.useCase.execute(params.id);

    if (result.isLeft()) {
      throw result.value;
    }

    return result.value;
  }
}
