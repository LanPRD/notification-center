import { ConflictException } from "@/application/errors/conflict-exception";
import { CreateNotificationUseCase } from "@/application/use-cases/notifications/create-notification";
import { InMemoryIdempotencyKeyRepository } from "__tests__/repositories/in-memory-idempotency-key-repository";
import { InMemoryNotificationRepository } from "__tests__/repositories/in-memory-notification-repository";
import { InMemoryUnitOfWork } from "__tests__/repositories/in-memory-unit-of-work";

let idempotencyKeyRepository: InMemoryIdempotencyKeyRepository;
let notificationRepository: InMemoryNotificationRepository;
let unitOfWork: InMemoryUnitOfWork;
let sut: CreateNotificationUseCase;

describe("Create Notification", () => {
  beforeEach(() => {
    idempotencyKeyRepository = new InMemoryIdempotencyKeyRepository();
    notificationRepository = new InMemoryNotificationRepository();
    unitOfWork = new InMemoryUnitOfWork([
      idempotencyKeyRepository,
      notificationRepository
    ]);

    sut = new CreateNotificationUseCase(
      idempotencyKeyRepository,
      notificationRepository,
      unitOfWork
    );
  });

  test("it should throw an error when idempotency key already exists", async () => {
    const idempotencyKeyHash = "existing-key";

    await idempotencyKeyRepository.create({
      key: idempotencyKeyHash,
      expiresAt: new Date(),
      responseBody: {},
      responseStatus: 201
    });

    const content = {
      title: "New notification",
      body: "This is a test notification."
    };

    const result = await sut.execute({
      content,
      userId: "user123",
      idempotencyKeyHash: idempotencyKeyHash,
      externalId: "unique-external-id"
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ConflictException);
    expect(idempotencyKeyRepository.idempotencyKeys).toHaveLength(1);
    expect(notificationRepository.notifications).toHaveLength(0);
  });

  test("it should be able to create a notification", async () => {
    const content = {
      title: "New notification",
      body: "This is a test notification."
    };

    const idempotencyKeyHash = "unique-key";

    const result = await sut.execute({
      content,
      userId: "user123",
      idempotencyKeyHash,
      externalId: "unique-external-id"
    });

    expect(result.isRight()).toBe(true);
    expect(notificationRepository.notifications[0].content).toEqual(content);
    expect(idempotencyKeyRepository.idempotencyKeys[0].key).toBe(
      idempotencyKeyHash
    );
  });

  test("it should rollback when notification creation fails (atomicity)", async () => {
    notificationRepository = new FailingNotificationRepository();
    unitOfWork = new InMemoryUnitOfWork([
      idempotencyKeyRepository,
      notificationRepository
    ]);

    sut = new CreateNotificationUseCase(
      idempotencyKeyRepository,
      notificationRepository,
      unitOfWork
    );

    await expect(
      sut.execute({
        content: { title: "t", body: "b" },
        userId: "user123",
        idempotencyKeyHash: "k-rollback",
        externalId: "ext-rollback"
      })
    ).rejects.toThrow("notification create failed");

    expect(idempotencyKeyRepository.idempotencyKeys).toHaveLength(0);
    expect(notificationRepository.notifications).toHaveLength(0);
  });

  class FailingNotificationRepository extends InMemoryNotificationRepository {
    async create(...args: any[]) {
      throw new Error("notification create failed");
    }
  }
});
