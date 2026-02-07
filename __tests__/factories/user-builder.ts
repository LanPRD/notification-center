import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { User, type UserProps } from "@/domain/entities/user";
import { PrismaUserMapper } from "@/infra/database/mappers/prisma-user-mapper";
import { PrismaService } from "@/infra/database/prisma/prisma.service";
import { faker } from "@faker-js/faker";
import { Injectable } from "@nestjs/common";

export class UserFactory {
  static build(id?: UniqueEntityID, data: Partial<UserProps> = {}): User {
    return User.create(
      {
        email: faker.internet.email(),
        phoneNumber: faker.phone.number(),
        pushToken: faker.string.uuid(),
        ...data
      },
      id ?? new UniqueEntityID(faker.string.uuid())
    );
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
