import { ConflictException } from "@/application/errors/conflict-exception";
import { left, right, type Either } from "@/core/either";
import { User } from "@/domain/entities/user";
import { UserRepository } from "@/domain/repositories/user-repository";
import type { CreateUserDto } from "@/infra/http/dtos/create-user.dto";
import { Injectable } from "@nestjs/common";

interface CreateUserInput {
  input: CreateUserDto;
}

type CreateUserUseCaseResponse = Either<
  ConflictException,
  {
    user: User;
  }
>;

@Injectable()
export class CreateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

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

    await this.userRepository.create(user);

    return right({ user });
  }
}
