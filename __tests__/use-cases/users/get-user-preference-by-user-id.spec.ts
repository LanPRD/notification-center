import { NotFoundException } from "@/application/errors/not-found-exception";
import { GetUserPreferenceByUserIdUseCase } from "@/application/use-cases/users/get-user-preference-by-user-id";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { UserPreferenceFactory } from "__tests__/factories/user-preference-builder";
import { InMemoryUserPreferenceRepository } from "__tests__/repositories/in-memory-user-preference-repository";

let inMemoryUserPreferenceRepository: InMemoryUserPreferenceRepository;
let sut: GetUserPreferenceByUserIdUseCase;

describe("Get User Preferences By ID", () => {
  beforeEach(() => {
    inMemoryUserPreferenceRepository = new InMemoryUserPreferenceRepository();
    sut = new GetUserPreferenceByUserIdUseCase(
      inMemoryUserPreferenceRepository
    );
  });

  test("it should return user preference if found", async () => {
    const userId = new UniqueEntityID();
    const userPref = UserPreferenceFactory.build({}, userId);

    inMemoryUserPreferenceRepository.register(userPref);

    const result = await sut.execute({ userId: userId.toString() });

    expect(result.isRight()).toBe(true);

    if (result.isRight()) {
      expect(result.value.userPreference).toEqual(userPref);
    }
  });

  test("it should throw an error if user preference doesn't exist", async () => {
    const userId = new UniqueEntityID();

    const result = await sut.execute({ userId: userId.toString() });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(NotFoundException);
    expect((result.value as Error).message).toBe("User preference not found.");
  });
});
