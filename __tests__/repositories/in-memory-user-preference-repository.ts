import { UserPreference } from "@/domain/entities/user-preference";
import type { UserPreferenceRepository } from "@/domain/repositories/user-preference-repository";

export class InMemoryUserPreferenceRepository implements UserPreferenceRepository {
  public userPreferences: UserPreference[] = [];

  async register(userPref: UserPreference): Promise<UserPreference> {
    this.userPreferences.push(userPref);
    return userPref;
  }

  async update(userPref: UserPreference): Promise<void> {
    const index = this.userPreferences.findIndex(
      up => up.userId.toString() === userPref.userId.toString()
    );

    if (index !== -1) {
      this.userPreferences[index] = userPref;
    }
  }

  async findByUserId(userId: string): Promise<UserPreference | null> {
    const userPref = this.userPreferences.find(
      up => up.userId.toString() === userId
    );

    return userPref ?? null;
  }
}
