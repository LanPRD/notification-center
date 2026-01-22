import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Post,
  UsePipes
} from "@nestjs/common";
import { ZodValidationPipe } from "src/common/pipes/zod-validation-pipe";
import { PrismaService } from "src/prisma/prisma.service";
import {
  createNotificationBodySchema,
  CreateNotificationDto
} from "../dtos/create-notification.dto";

@Controller("/notifications")
export class CreateNotificationController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(createNotificationBodySchema))
  async handle(@Body() body: CreateNotificationDto) {
    const request = body;

    const alreadyHasNotification = await this.checkNotificationAlreadyExists(
      request.externalId
    );

    if (alreadyHasNotification) {
      throw new ConflictException(
        "Notification with the same external ID already exists."
      );
    }

    return this.prisma.notification.create({
      data: request
    });
  }

  private async checkNotificationAlreadyExists(
    externalId?: string
  ): Promise<boolean> {
    if (!externalId) return false;
    return (
      (await this.prisma.notification.count({ where: { externalId } })) > 0
    );
  }
}
