import { CancelNotificationUseCase } from "@/application/use-cases/notifications/cancel-notification";
import { Controller, HttpCode, Param, Patch, UsePipes } from "@nestjs/common";
import {
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags
} from "@nestjs/swagger";
import { ZodValidationPipe } from "nestjs-zod";
import { BaseErrorResponseDto } from "../dtos/error-response.dto";
import {
  CancelNotificationResponseDto,
  getNotificationByIdSchema
} from "../dtos/get-notification-by-id.dto";

@Controller()
@ApiTags("Notifications")
export class CancelNotificationController {
  constructor(private readonly useCase: CancelNotificationUseCase) {}

  @Patch("/notifications/:id")
  @HttpCode(200)
  @ApiOkResponse({ type: CancelNotificationResponseDto })
  @ApiNotFoundResponse({ type: BaseErrorResponseDto })
  @ApiConflictResponse({ type: BaseErrorResponseDto })
  @UsePipes(new ZodValidationPipe(getNotificationByIdSchema))
  async handle(@Param("id") id: string) {
    const result = await this.useCase.execute(id);
    return result;
  }
}
