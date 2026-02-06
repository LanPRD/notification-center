import { NotFoundException } from "@/application/errors/not-found-exception";
import { left, right, type Either } from "@/core/either";
import { UserPreference } from "@/domain/entities/user-preference";
import { UserPreferenceRepository } from "@/domain/repositories/user-preference-repository";
import { Injectable } from "@nestjs/common";

interface GetUserPreferenceByUserIdInput {
  userId: string;
}

type GetUserPreferenceByUserIdResponse = Either<
  NotFoundException,
  {
    userPreference: UserPreference;
  }
>;

@Injectable()
export class GetUserPreferenceByUserIdUseCase {
  constructor(private readonly userPrefsRepository: UserPreferenceRepository) {}

  public async execute({
    userId
  }: GetUserPreferenceByUserIdInput): Promise<GetUserPreferenceByUserIdResponse> {
    const userPreference = await this.userPrefsRepository.findByUserId(userId);

    if (!userPreference) {
      return left(
        new NotFoundException({
          message: "User preference not found."
        })
      );
    }

    return right({ userPreference });
  }
}
