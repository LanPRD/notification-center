import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { User } from "@/domain/entities/user";
import { PhoneNumber } from "@/domain/value-objects/phone-number";
import type { Prisma, User as PrismaUser } from "@prisma/client";

export class PrismaUserMapper {
  static toDomain(raw: PrismaUser): User {
    let phoneNumber: PhoneNumber | null = null;

    if (raw.phoneNumber) {
      const phoneOrError = PhoneNumber.create(raw.phoneNumber);

      if (phoneOrError.isRight()) {
        phoneNumber = phoneOrError.value;
      }
    }

    return User.create(
      {
        email: raw.email,
        phoneNumber,
        pushToken: raw.pushToken
      },
      new UniqueEntityID(raw.id)
    );
  }

  static toPrisma(user: User): Prisma.UserUncheckedCreateInput {
    return {
      id: user.id.toString(),
      email: user.email,
      phoneNumber: user.phoneNumber?.value ?? null,
      pushToken: user.pushToken
    };
  }
}
