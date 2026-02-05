import { ConflictException } from "@/application/errors/conflict-exception";
import { CreateUserUseCase } from "@/application/use-cases/users/create-user";
import { InMemoryUserPreferenceRepository } from "__tests__/repositories/in-memory-user-preference-repository";
import { InMemoryUserRepository } from "__tests__/repositories/in-memory-user-repository";

let inMemoryUserPreferenceRepository: InMemoryUserPreferenceRepository;
let inMemoryUserRepository: InMemoryUserRepository;
let sut: CreateUserUseCase;

describe("Create User", () => {
  beforeEach(() => {
    inMemoryUserPreferenceRepository = new InMemoryUserPreferenceRepository();
    inMemoryUserRepository = new InMemoryUserRepository();
    sut = new CreateUserUseCase(
      inMemoryUserRepository,
      inMemoryUserPreferenceRepository
    );
  });

  test("it should create a new user", async () => {
    const input = {
      email: "john.doe@example.com",
      pushToken: "test-token",
      phoneNumber: "+1234567890"
    };

    const result = await sut.execute({ input });

    expect(result.isRight()).toBe(true);
    expect(inMemoryUserRepository.users).toHaveLength(1);

    if (result.isRight()) {
      expect(result.value.user).toEqual(inMemoryUserRepository.users[0]);
      expect(inMemoryUserPreferenceRepository.userPreferences).toHaveLength(1);
    }
  });

  test("it should not be able to create a user with an existing email", async () => {
    const input = {
      email: "john.doe@example.com",
      pushToken: "test-token",
      phoneNumber: "+1234567890"
    };

    const result = await sut.execute({ input });
    const result2 = await sut.execute({ input });

    expect(result.isRight()).toBe(true);
    expect(result2.isLeft()).toBe(true);
    expect(result2.value).toBeInstanceOf(ConflictException);
    expect(inMemoryUserRepository.users).toHaveLength(1);
  });
});
