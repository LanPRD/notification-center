import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import {
  UserPreference,
  type UserPreferenceProps
} from "@/domain/entities/user-preference";
import { PrismaUserPreferenceMapper } from "@/infra/database/mappers/prisma-user-preference-mapper";
import { PrismaService } from "@/infra/database/prisma/prisma.service";
import { faker } from "@faker-js/faker";
import { Injectable } from "@nestjs/common";

export class UserPreferenceFactory {
  static build(
    overrides: Partial<UserPreference> = {},
    userId?: UniqueEntityID
  ) {
    return UserPreference.create({
      allowEmail: faker.datatype.boolean(),
      allowSMS: faker.datatype.boolean(),
      allowPush: faker.datatype.boolean(),
      ...overrides,
      userId: userId ?? new UniqueEntityID()
    });
  }
}

@Injectable()
export class PrismaUserPreferenceFactory {
  constructor(private readonly prisma: PrismaService) {}

  async build(
    id: UniqueEntityID,
    data: Partial<UserPreferenceProps> = {}
  ): Promise<UserPreference> {
    const userPrefs = UserPreferenceFactory.build(data, id);

    await this.prisma.userPreference.create({
      data: PrismaUserPreferenceMapper.toPrisma(userPrefs)
    });

    return userPrefs;
  }
}
