import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { User, type UserProps } from "@/domain/entities/user";
import { PhoneNumber } from "@/domain/value-objects/phone-number";
import { PrismaUserMapper } from "@/infra/database/mappers/prisma-user-mapper";
import { PrismaService } from "@/infra/database/prisma/prisma.service";
import { faker } from "@faker-js/faker";
import { Injectable } from "@nestjs/common";

export class UserFactory {
  static build(id?: UniqueEntityID, data: Partial<UserProps> = {}): User {
    return User.create(
      {
        email: faker.internet.email(),
        phoneNumber: UserFactory.generateValidPhone(),
        pushToken: new UniqueEntityID().toString(),
        ...data
      },
      id ?? new UniqueEntityID()
    );
  }

  static generateValidPhone(): PhoneNumber {
    const ddi = "+55";
    const number = faker.string.numeric(11);
    const phoneOrError = PhoneNumber.create(`${ddi}${number}`);

    if (phoneOrError.isLeft()) {
      throw new Error("Failed to generate valid phone number");
    }

    return phoneOrError.value;
  }
}

@Injectable()
export class PrismaUserFactory {
  constructor(private readonly prisma: PrismaService) {}

  async build(
    id: UniqueEntityID,
    data: Partial<UserProps> = {}
  ): Promise<User> {
    const user = UserFactory.build(id);

    await this.prisma.user.create({
      data: PrismaUserMapper.toPrisma(user)
    });

    return user;
  }
}
