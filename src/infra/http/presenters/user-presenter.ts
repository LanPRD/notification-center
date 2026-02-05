import type { User } from "@/domain/entities/user";
import type { UserPreference } from "@/domain/entities/user-preference";

export class UserPresenter {
  static toHTTP(user: User, userPrefs: UserPreference) {
    return {
      id: user.id.toString(),
      email: user.email,
      phoneNumber: user.phoneNumber,
      pushToken: user.pushToken,
      allowEmail: userPrefs.allowEmail,
      allowSMS: userPrefs.allowSMS,
      allowPush: userPrefs.allowPush
    };
  }
}
