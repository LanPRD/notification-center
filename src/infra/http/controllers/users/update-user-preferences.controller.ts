import { UpdateUserPreferencesUseCase } from "@/application/use-cases/users/update-user-preferences";
import { Body, Controller, HttpCode, Param, Put } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiTags
} from "@nestjs/swagger";
import { BaseErrorResponseDto } from "../../dtos/error-response.dto";
import {
  UpdateUserPrefsBodyDto,
  updateUserPrefsBodySchema,
  updateUserPrefsParamSchema,
  type UpdateUserPrefsParamDto
} from "../../dtos/update-user-preferences.dto";
import { ZodValidationPipe } from "../../pipes/zod-validation-pipe";

@Controller()
@ApiTags("Users")
export class UpdateUserPreferencesController {
  constructor(private readonly useCase: UpdateUserPreferencesUseCase) {}

  @Put("/users/:userId/preferences")
  @HttpCode(204)
  @ApiOperation({
    summary: "Update user preferences by user ID",
    description:
      "Updates the notification preferences for a specific user. Allows changing preferred channels (email, SMS, push) and quiet hours settings."
  })
  @ApiBody({
    type: UpdateUserPrefsBodyDto,
    description: "User preferences to update"
  })
  @ApiParam({
    name: "userId",
    type: "string",
    format: "uuid",
    description: "The user ID"
  })
  @ApiNoContentResponse({
    description: "User preferences updated successfully"
  })
  @ApiBadRequestResponse({
    description: "Invalid user ID format or invalid preferences data",
    type: BaseErrorResponseDto
  })
  @ApiNotFoundResponse({
    description: "User preferences not found",
    type: BaseErrorResponseDto
  })
  @ApiInternalServerErrorResponse({
    description: "Failed to update user preferences",
    type: BaseErrorResponseDto
  })
  async handle(
    @Param(new ZodValidationPipe(updateUserPrefsParamSchema))
    params: UpdateUserPrefsParamDto,
    @Body(new ZodValidationPipe(updateUserPrefsBodySchema))
    preferences: UpdateUserPrefsBodyDto
  ): Promise<void> {
    const result = await this.useCase.execute({
      userId: params.userId,
      preferences
    });

    if (result.isLeft()) {
      throw result.value;
    }
  }
}
