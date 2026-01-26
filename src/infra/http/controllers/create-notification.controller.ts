import type { PrismaService } from "@/infra/database/prisma/prisma.service";
import {
  createNotificationBodySchema,
  idempotencyKeySchema,
  type CreateNotificationDto
} from "@/infra/http/dtos/create-notification.dto";
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Headers,
  HttpCode,
  Post,
  UsePipes
} from "@nestjs/common";
import { ZodValidationPipe } from "nestjs-zod";
import { z } from "zod";

@Controller("/notifications")
export class CreateNotificationController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(createNotificationBodySchema))
  async handle(@Headers() rawHeader: any, @Body() body: CreateNotificationDto) {
    const { success, data, error } = idempotencyKeySchema.safeParse(rawHeader);
    const request = body;

    if (!success) {
      throw new BadRequestException({
        message: "Validation failed",
        issues: z.treeifyError(error)
      });
    }

    const alreadyHasIdempotencyKey =
      await this.checkIdempotencyKeyAlreadyExists(data["idempotency-key"]);

    if (alreadyHasIdempotencyKey) {
      throw new ConflictException(
        "Idempotency key already exists. Please provide a new idempotency key."
      );
    }

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

    const alreadyExists = await this.prisma.notification.count({
      where: { externalId }
    });

    return alreadyExists > 0;
  }

  private async checkIdempotencyKeyAlreadyExists(
    idempotencyKey: string
  ): Promise<boolean> {
    const alreadyExists = await this.prisma.idempotencyKey.count({
      where: { key: idempotencyKey }
    });

    return alreadyExists > 0;
  }
}
