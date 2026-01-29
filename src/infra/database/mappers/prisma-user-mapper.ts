import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { User } from "@/domain/entities/user";
import type { Prisma, User as PrismaUser } from "@prisma/client";

export class PrismaUserMapper {
  static toDomain(raw: PrismaUser): User {
    return User.create(
      {
        email: raw.email,
        phoneNumber: raw.phoneNumber,
        pushToken: raw.pushToken
      },
      new UniqueEntityID(raw.id)
    );
  }

  static toPrisma(user: User): Prisma.UserUncheckedCreateInput {
    return {
      email: user.email,
      phoneNumber: user.phoneNumber,
      pushToken: user.pushToken
    };
  }
}
