import { GetNotificationByIdUseCase } from "@/application/use-cases/notifications/get-notification-by-id";
import { Controller, Get, HttpCode, Param, UsePipes } from "@nestjs/common";
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { ZodValidationPipe } from "nestjs-zod";
import { BaseErrorResponseDto } from "../dtos/error-response.dto";
import {
  getNotificationByIdSchema,
  GetNotificationResponseDto
} from "../dtos/get-notification-by-id.dto";

@Controller()
@ApiTags("Notifications")
export class GetNotificationByIdController {
  constructor(private readonly useCase: GetNotificationByIdUseCase) {}

  @Get("/notifications/:id")
  @HttpCode(200)
  @ApiOkResponse({ type: GetNotificationResponseDto })
  @ApiNotFoundResponse({ type: BaseErrorResponseDto })
  @UsePipes(new ZodValidationPipe(getNotificationByIdSchema))
  async handle(@Param("id") id: string) {
    const result = await this.useCase.execute(id);
    return result;
  }
}
