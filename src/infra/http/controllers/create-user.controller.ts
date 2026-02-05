import { CreateUserUseCase } from "@/application/use-cases/users/create-user";
import { Body, Controller, HttpCode, Post, UsePipes } from "@nestjs/common";
import {
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiTags
} from "@nestjs/swagger";
import { ZodValidationPipe } from "nestjs-zod";
import { CreateUserDto, createUserSchema } from "../dtos/create-user.dto";
import { BaseErrorResponseDto } from "../dtos/error-response.dto";
import { UserResponseDto } from "../dtos/user-response.dto";
import { UserPresenter } from "../presenters/user-presenter";

@Controller("/users")
@ApiTags("Users")
export class CreateUserController {
  constructor(private readonly useCase: CreateUserUseCase) {}

  @Post()
  @HttpCode(201)
  @ApiBody({ type: CreateUserDto })
  @ApiCreatedResponse({ type: UserResponseDto })
  @ApiConflictResponse({ type: BaseErrorResponseDto })
  @UsePipes(new ZodValidationPipe(createUserSchema))
  async handle(@Body() body: CreateUserDto): Promise<UserResponseDto> {
    const result = await this.useCase.execute({ input: body });

    if (result.isLeft()) {
      console.log(result.value);
      throw result.value;
    }

    return UserPresenter.toHTTP(result.value.user, result.value.userPrefs);
  }
}
