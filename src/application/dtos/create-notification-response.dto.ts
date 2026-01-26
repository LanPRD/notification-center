import type { Either } from "@/core/either";
import type { Notification } from "@/domain/entities/notification";
import type { ConflictException } from "../errors/conflict-exception";

export type CreateNotificationUseCaseResponse = Either<
  ConflictException,
  { notification: Notification }
>;
