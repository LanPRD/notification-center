import { PrismaService } from "@/infra/database/prisma/prisma.service";
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
import { ZodValidationPipe } from "nestjs-zod";
import { ApiStandardResponses } from "../decorators/api-standard-responses.decorator";
import { CreateUserDto, createUserSchema } from "../dtos/create-user.dto";
import { ErrorResponseDto } from "../dtos/error-response.dto";
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
