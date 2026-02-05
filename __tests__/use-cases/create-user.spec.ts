import { ConflictException } from "@/application/errors/conflict-exception";
import { InternalException } from "@/application/errors/internal-exception";
import { CreateUserUseCase } from "@/application/use-cases/users/create-user";
import { InMemoryUserPreferenceRepository } from "__tests__/repositories/in-memory-user-preference-repository";
import { InMemoryUserRepository } from "__tests__/repositories/in-memory-user-repository";
import { vi } from "vitest";

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

  test("it should return InternalException when user creation fails", async () => {
    vi.spyOn(inMemoryUserRepository, "create").mockRejectedValueOnce(
      new Error("DB connection failed")
    );

    const input = {
      email: "john.doe@example.com",
      pushToken: "test-token",
      phoneNumber: "+1234567890"
    };

    const result = await sut.execute({ input });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InternalException);

    if (result.isLeft()) {
      expect(result.value.message).toBe("Failed to create user.");
    }
  });

  test("it should return InternalException when user preferences registration fails", async () => {
    vi.spyOn(
      inMemoryUserPreferenceRepository,
      "register"
    ).mockRejectedValueOnce(new Error("DB connection failed"));

    const input = {
      email: "john.doe@example.com",
      pushToken: "test-token",
      phoneNumber: "+1234567890"
    };

    const result = await sut.execute({ input });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InternalException);

    if (result.isLeft()) {
      expect(result.value.message).toBe("Failed to register user preferences.");
    }
  });
});
