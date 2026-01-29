import { BadRequestException } from "@/application/errors/bad-request-exception";
import { ConflictException } from "@/application/errors/conflict-exception";
import { type Either } from "@/core/either";
import { Notification } from "@/domain/entities/notification";
import { NotificationRepository } from "@/domain/repositories/notification-repository";
import { type CreateNotificationDto } from "@/infra/http/dtos/create-notification.dto";
import { Injectable } from "@nestjs/common";

interface CreateUserInput {
  input: CreateNotificationDto;
  rawHeader: any;
}

type CreateUserUseCaseResponse = Either<
  BadRequestException | ConflictException,
  {
    notification: Notification;
  }
>;

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository
  ) {}

  public async execute({
    input
  }: CreateUserInput): Promise<CreateUserUseCaseResponse> {
    return {} as CreateUserUseCaseResponse;
  }
}
