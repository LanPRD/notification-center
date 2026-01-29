import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { User } from "@/domain/entities/user";
import { faker } from "@faker-js/faker";

export function userBuild(id?: UniqueEntityID) {
  return User.create(
    {
      email: faker.internet.email(),
      phoneNumber: faker.phone.number(),
      pushToken: faker.string.uuid()
    },
    id ?? new UniqueEntityID(faker.string.uuid())
  );
}
