import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { UserPreference } from "@/domain/entities/user-preference";
import { faker } from "@faker-js/faker";

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
