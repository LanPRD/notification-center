import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Post,
  UsePipes
} from "@nestjs/common";
import {
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiTags
} from "@nestjs/swagger";
import { ApiStandardResponses } from "src/common/decorators/api-standard-responses.decorator";
import { ZodValidationPipe } from "src/common/pipes/zod-validation-pipe";
import { PrismaService } from "src/prisma/prisma.service";
import { ErrorResponseDto } from "../../common/dtos/error-response.dto";
import { CreateUserDto, createUserSchema } from "../dtos/create-user.dto";
import { UserResponseDto } from "../dtos/user-response.dto";

@Controller("/users")
@ApiTags("Users")
@ApiStandardResponses()
export class CreateUserController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @HttpCode(201)
  @ApiBody({ type: CreateUserDto })
  @ApiCreatedResponse({ type: UserResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto })
  @UsePipes(new ZodValidationPipe(createUserSchema))
  async handle(@Body() body: CreateUserDto): Promise<UserResponseDto> {
    const userAlreadyExist = await this.checkUserAlreadyExists(body.email);

    if (userAlreadyExist) {
      throw new ConflictException("User with the same email already exists.");
    }

    return this.prisma.user.create({ data: body });
  }

  private async checkUserAlreadyExists(email: string): Promise<boolean> {
    return (await this.prisma.user.count({ where: { email } })) > 0;
  }
}
