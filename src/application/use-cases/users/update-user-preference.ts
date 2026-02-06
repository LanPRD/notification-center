import { InternalException } from "@/application/errors/internal-exception";
import { NotFoundException } from "@/application/errors/not-found-exception";
import { left, right, type Either } from "@/core/either";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { UserPreference } from "@/domain/entities/user-preference";
import { UserPreferenceRepository } from "@/domain/repositories/user-preference-repository";
import { Injectable } from "@nestjs/common";

interface UpdateUserPreferenceInput {
  userId: string;
  preferences: {
    allowEmail: boolean;
    allowSMS: boolean;
    allowPush: boolean;
  };
}

type UpdateUserPreferenceUseCaseResponse = Either<
  InternalException | NotFoundException,
  null
>;

@Injectable()
export class UpdateUserPreferenceUseCase {
  constructor(
    private readonly userPreferenceRepository: UserPreferenceRepository
  ) {}

  public async execute({
    preferences,
    userId
  }: UpdateUserPreferenceInput): Promise<UpdateUserPreferenceUseCaseResponse> {
    const existingUserPref =
      await this.userPreferenceRepository.findByUserId(userId);

    if (!existingUserPref) {
      return left(
        new NotFoundException({
          message: "User preference not found."
        })
      );
    }

    const userPref = UserPreference.create({
      userId: new UniqueEntityID(userId),
      ...preferences
    });

    try {
      await this.userPreferenceRepository.update(userPref);
    } catch (_error) {
      return left(
        new InternalException({
          message: "Failed to update user preferences."
        })
      );
    }

    return right(null);
  }
}
