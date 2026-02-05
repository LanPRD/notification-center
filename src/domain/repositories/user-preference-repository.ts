import type { User } from "../entities/user";
import type { UserPreference } from "../entities/user-preference";

export abstract class UserPreferenceRepository {
  abstract register(user: User): Promise<UserPreference>;
  abstract update(userPref: UserPreference): Promise<void>;
  abstract findByUserId(email: string): Promise<UserPreference | null>;
}
