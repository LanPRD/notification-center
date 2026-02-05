import { CreateUserUseCase } from "@/application/use-cases/users/create-user";
import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiTags
} from "@nestjs/swagger";
import { ZodValidationPipe } from "nestjs-zod";
import { BaseErrorResponseDto } from "../dtos/error-response.dto";
import {
  CreateUserBodyDto,
  createUserBodySchema,
  UserResponseDto
} from "../dtos/user.dto";
import { UserPresenter } from "../presenters/user-presenter";

@Controller("/users")
@ApiTags("Users")
export class CreateUserController {
  constructor(private readonly useCase: CreateUserUseCase) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: "Create a new user" })
  @ApiBody({ type: CreateUserBodyDto })
  @ApiCreatedResponse({
    description: "User created successfully",
    type: UserResponseDto
  })
  @ApiBadRequestResponse({
    description: "Invalid request body",
    type: BaseErrorResponseDto
  })
  @ApiConflictResponse({
    description: "User with the same email already exists",
    type: BaseErrorResponseDto
  })
  @ApiInternalServerErrorResponse({
    description: "Failed to create user or register preferences",
    type: BaseErrorResponseDto
  })
  async handle(
    @Body(new ZodValidationPipe(createUserBodySchema)) body: CreateUserBodyDto
  ): Promise<UserResponseDto> {
    const result = await this.useCase.execute({ input: body });

    if (result.isLeft()) {
      throw result.value;
    }

    return UserPresenter.toHTTP(result.value.user, result.value.userPrefs);
  }
}
