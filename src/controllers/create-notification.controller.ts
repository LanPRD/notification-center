import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Post,
  UsePipes
} from "@nestjs/common";
import { $Enums } from "@prisma/client";
import { ZodValidationPipe } from "src/pipes/zod-validation-pipe";
import { PrismaService } from "src/prisma/prisma.service";
import { z } from "zod";

const createNotificationBodySchema = z.object({
  userId: z.uuid(),
  templateName: z.string().min(1),
  content: z.record(z.string(), z.any()),
  priority: z.enum($Enums.NotificationPriority),
  externalId: z.string().optional()
});

type CreateNotificationBody = z.infer<typeof createNotificationBodySchema>;

@Controller("/notifications")
export class CreateNotificationController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(createNotificationBodySchema))
  async handle(@Body() body: CreateNotificationBody) {
    const request = body;

    const alreadyHasNotification = await this.checkNotificationAlreadyExists(
      request.externalId
    );

    if (alreadyHasNotification) {
      throw new ConflictException(
        "Notification with the same external ID already exists."
      );
    }

    await this.prisma.notification.create({
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
