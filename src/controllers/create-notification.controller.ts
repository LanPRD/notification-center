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
  content: z.record(z.string(), z.unknown()),
  priority: z.enum($Enums.NotificationPriority).optional(),
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
    console.log("Received notification:", body);
    const { externalId } = body;

    const alreadyHasNotification = await this.prisma.notification.findUnique({
      where: {
        externalId
      }
    });

    if (alreadyHasNotification) {
      throw new ConflictException(
        "Notification with the same external ID already exists."
      );
    }

    // await this.prisma.notification.create({
    //   data: notification
    // });
  }
}
