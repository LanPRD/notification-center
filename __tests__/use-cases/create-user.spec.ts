import { ConflictException } from "@/application/errors/conflict-exception";
import { CreateUserUseCase } from "@/application/use-cases/users/create-user";
import { InMemoryUserRepository } from "__tests__/repositories/in-memory-user-repository";

let inMemoryUserRepository: InMemoryUserRepository;
let sut: CreateUserUseCase;

describe("Create User", () => {
  beforeEach(() => {
    inMemoryUserRepository = new InMemoryUserRepository();
    sut = new CreateUserUseCase(inMemoryUserRepository);
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
    expect(result.value).toEqual({
      user: inMemoryUserRepository.users[0]
    });
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
