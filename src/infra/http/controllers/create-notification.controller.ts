import { CreateNotificationUseCase } from "@/application/use-cases/notifications/create-notification";
import {
  createNotificationBodySchema,
  type CreateNotificationDto
} from "@/infra/http/dtos/create-notification.dto";
import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  UsePipes
} from "@nestjs/common";
import { ZodValidationPipe } from "nestjs-zod";

@Controller("/notifications")
export class CreateNotificationController {
  constructor(private readonly useCase: CreateNotificationUseCase) {}

  @Post()
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(createNotificationBodySchema))
  async handle(@Headers() rawHeader: any, @Body() body: CreateNotificationDto) {
    const result = await this.useCase.execute({ input: body, rawHeader });

    if (result.isLeft()) {
      console.log(result.value);
      throw result.value;
    }

    return result.value.notification;
  }
}
