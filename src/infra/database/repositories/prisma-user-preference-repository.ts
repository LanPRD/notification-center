import type { User } from "@/domain/entities/user";
import type { UserPreference } from "@/domain/entities/user-preference";
import type { UserPreferenceRepository } from "@/domain/repositories/user-preference-repository";
import { Injectable } from "@nestjs/common";
import { PrismaUserPreferenceMapper } from "../mappers/prisma-user-preference-mapper";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PrismaUserPreferenceRepository implements UserPreferenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async register(user: User): Promise<UserPreference> {
    const userPrefs = await this.prisma.userPreference.create({
      data: PrismaUserPreferenceMapper.toPrisma(user)
    });

    return PrismaUserPreferenceMapper.toDomain(userPrefs);
  }

  async update(userPref: UserPreference): Promise<void> {
    const { allowEmail, allowPush, allowSMS } = userPref;

    await this.prisma.userPreference.update({
      where: { userId: userPref.userId.toString() },
      data: { allowEmail, allowSMS, allowPush }
    });
  }

  async findByUserId(userId: string): Promise<UserPreference | null> {
    const userPrefs = await this.prisma.userPreference.findUnique({
      where: { userId }
    });

    return userPrefs ? PrismaUserPreferenceMapper.toDomain(userPrefs) : null;
  }
}
