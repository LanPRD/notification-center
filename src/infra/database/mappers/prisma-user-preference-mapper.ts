import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { UserPreference } from "@/domain/entities/user-preference";
import type {
  Prisma,
  UserPreference as PrismaUserPreference
} from "@prisma/client";

export class PrismaUserPreferenceMapper {
  static toDomain(raw: PrismaUserPreference): UserPreference {
    return UserPreference.create({
      allowEmail: raw.allowEmail,
      allowSMS: raw.allowSMS,
      allowPush: raw.allowPush,
      userId: new UniqueEntityID(raw.userId)
    });
  }

  static toPrisma(
    userPref: UserPreference
  ): Prisma.UserPreferenceUncheckedCreateInput {
    return {
      userId: userPref.userId.toString(),
      allowEmail: userPref.allowEmail,
      allowSMS: userPref.allowSMS,
      allowPush: userPref.allowPush
    };
  }
}
