import { GetUserPreferenceByUserIdUseCase } from "@/application/use-cases/users/get-user-preference-by-user-id";
import { Controller, Get, HttpCode, Param } from "@nestjs/common";
import {
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
  @ApiOperation({ summary: "Get user preference by user ID" })
  @ApiParam({
    name: "userId",
    type: "string",
    format: "uuid",
    description: "The user ID"
  })
  @ApiOkResponse({
    description: "User preference retrieved successfully",
    type: GetUserPreferenceByUserIdResponseDto
  })
  @ApiNotFoundResponse({
    description: "User not found",
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
