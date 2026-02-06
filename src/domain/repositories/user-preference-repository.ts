import type { UserPreference } from "../entities/user-preference";

export abstract class UserPreferenceRepository {
  abstract register(user: UserPreference): Promise<UserPreference>;
  abstract update(userPref: UserPreference): Promise<void>;
  abstract findByUserId(userId: string): Promise<UserPreference | null>;
}
