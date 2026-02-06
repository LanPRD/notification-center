import { InternalException } from "@/application/errors/internal-exception";
import { NotFoundException } from "@/application/errors/not-found-exception";
import { UpdateUserPreferenceUseCase } from "@/application/use-cases/users/update-user-preference";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { UserPreferenceFactory } from "__tests__/factories/user-preference-builder";
import { InMemoryUserPreferenceRepository } from "__tests__/repositories/in-memory-user-preference-repository";
import { vi } from "vitest";

let inMemoryUserPreferenceRepository: InMemoryUserPreferenceRepository;
let sut: UpdateUserPreferenceUseCase;

describe("Update User Preferences", () => {
  beforeEach(() => {
    inMemoryUserPreferenceRepository = new InMemoryUserPreferenceRepository();
    sut = new UpdateUserPreferenceUseCase(inMemoryUserPreferenceRepository);
  });

  test("it should update user preference if found", async () => {
    const userId = new UniqueEntityID();
    const userPref = UserPreferenceFactory.build(
      {
        allowEmail: true,
        allowSMS: true,
        allowPush: true
      },
      userId
    );

    inMemoryUserPreferenceRepository.register(userPref);

    const newPrefs = {
      allowEmail: false,
      allowSMS: false,
      allowPush: true
    };

    const updatedUserPref = UserPreferenceFactory.build(newPrefs, userId);

    const result = await sut.execute({
      userId: userId.toString(),
      preferences: {
        allowEmail: false,
        allowSMS: false,
        allowPush: true
      }
    });

    const updatedPrefs = await inMemoryUserPreferenceRepository.findByUserId(
      userId.toString()
    );

    expect(result.isRight()).toBe(true);
    expect(updatedPrefs).toEqual(updatedUserPref);
  });

  test("it should throw an error if user preference doesn't exist", async () => {
    const userId = new UniqueEntityID();

    const result = await sut.execute({
      userId: userId.toString(),
      preferences: {
        allowEmail: false,
        allowSMS: false,
        allowPush: true
      }
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(NotFoundException);
    expect((result.value as Error).message).toBe("User preference not found.");
  });

  test("it should throw an error if user preference update fails", async () => {
    vi.spyOn(inMemoryUserPreferenceRepository, "update").mockRejectedValueOnce(
      new Error("DB connection failed")
    );

    const userId = new UniqueEntityID();
    const userPref = UserPreferenceFactory.build(
      {
        allowEmail: true,
        allowSMS: true,
        allowPush: true
      },
      userId
    );

    inMemoryUserPreferenceRepository.register(userPref);

    const newPrefs = {
      allowEmail: false,
      allowSMS: false,
      allowPush: true
    };

    const result = await sut.execute({
      userId: userId.toString(),
      preferences: {
        allowEmail: false,
        allowSMS: false,
        allowPush: true
      }
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InternalException);

    if (result.isLeft()) {
      expect(result.value.message).toBe("Failed to update user preferences.");
    }
  });
});
