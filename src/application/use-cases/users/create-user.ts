import { ConflictException } from "@/application/errors/conflict-exception";
import { InternalException } from "@/application/errors/internal-exception";
import { left, right, type Either } from "@/core/either";
import { User } from "@/domain/entities/user";
import { UserPreference } from "@/domain/entities/user-preference";
import { UserPreferenceRepository } from "@/domain/repositories/user-preference-repository";
import { UserRepository } from "@/domain/repositories/user-repository";
import type { CreateUserInputDto } from "@/application/dtos/create-user-input.dto";
import { Injectable } from "@nestjs/common";

interface CreateUserInput {
  input: CreateUserInputDto;
}

type CreateUserUseCaseResponse = Either<
  ConflictException | InternalException,
  {
    user: User;
    userPrefs: UserPreference;
  }
>;

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userPrefsRepository: UserPreferenceRepository
  ) {}

  public async execute({
    input
  }: CreateUserInput): Promise<CreateUserUseCaseResponse> {
    const { email, phoneNumber, pushToken } = input;

    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      return left(
        new ConflictException({
          message: "User with the same email already exists."
        })
      );
    }

    const user = User.create({ email, phoneNumber, pushToken });
    const userPrefs = UserPreference.create({
      userId: user.id,
      allowEmail: true,
      allowSMS: true,
      allowPush: true
    });

    try {
      await this.userRepository.create(user);
    } catch (_error) {
      return left(
        new InternalException({
          message: "Failed to create user."
        })
      );
    }

    try {
      await this.userPrefsRepository.register(user);
    } catch (_error) {
      return left(
        new InternalException({
          message: "Failed to register user preferences."
        })
      );
    }

    return right({ user, userPrefs });
  }
}
