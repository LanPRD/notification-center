import type { UserPreference } from "@/domain/entities/user-preference";

export class UserPreferencePresenter {
  static toHTTP(userPrefs: UserPreference) {
    return {
      userId: userPrefs.userId.toString(),
      allowEmail: userPrefs.allowEmail,
      allowSMS: userPrefs.allowSMS,
      allowPush: userPrefs.allowPush
    };
  }
}
