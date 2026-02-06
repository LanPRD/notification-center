import { GetUserPreferenceByUserIdUseCase } from "@/application/use-cases/users/get-user-preference-by-user-id";
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
  getUserPreferenceByUserIdParamSchema,
  GetUserPreferenceByUserIdResponseDto,
  type GetUserPreferenceByUserIdParamDto
} from "../../dtos/get-user-preference-by-user-id.dto";
import { UserPreferencePresenter } from "../../presenters/user-preference-presenter";

@Controller()
@ApiTags("Users")
export class GetUserPreferenceByUserIdController {
  constructor(private readonly useCase: GetUserPreferenceByUserIdUseCase) {}

  @Get("/users/:userId/preferences")
  @HttpCode(200)
  @ApiOperation({
    summary: "Get user preferences by user ID",
    description:
      "Retrieves the notification preferences for a specific user, including their preferred channels (email, SMS, push) and quiet hours settings."
  })
  @ApiParam({
    name: "userId",
    type: "string",
    format: "uuid",
    description: "The user ID"
  })
  @ApiOkResponse({
    description: "User preferences retrieved successfully",
    type: GetUserPreferenceByUserIdResponseDto
  })
  @ApiBadRequestResponse({
    description: "Invalid user ID format",
    type: BaseErrorResponseDto
  })
  @ApiNotFoundResponse({
    description: "User preferences not found",
    type: BaseErrorResponseDto
  })
  async handle(
    @Param(new ZodValidationPipe(getUserPreferenceByUserIdParamSchema))
    params: GetUserPreferenceByUserIdParamDto
  ): Promise<GetUserPreferenceByUserIdResponseDto> {
    const result = await this.useCase.execute({ userId: params.userId });

    if (result.isLeft()) {
      throw result.value;
    }

    return UserPreferencePresenter.toHTTP(result.value.userPreference);
  }
}
