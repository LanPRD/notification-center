import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Post,
  UsePipes
} from "@nestjs/common";
import { ZodValidationPipe } from "src/pipes/zod-validation-pipe";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

const createUserBodySchema = z.object({
  email: z.email(),
  phoneNumber: z.string().optional(),
  pushToken: z.string().optional()
});

type CreaterUserBody = z.infer<typeof createUserBodySchema>;

@Controller("/users")
export class CreateUserController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(createUserBodySchema))
  async handle(@Body() body: CreaterUserBody) {
    const request = body;

    const userAlreadyExist = await this.checkUserAlreadyExists(request.email);

    if (userAlreadyExist) {
      throw new ConflictException("User with the same email already exists.");
    }

    await this.prisma.user.create({
      data: request
    });
  }

  private async checkUserAlreadyExists(email: string): Promise<boolean> {
    return (await this.prisma.user.count({ where: { email } })) > 0;
  }
}
