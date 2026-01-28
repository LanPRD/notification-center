import { ConflictException } from "@/application/errors/conflict-exception";
import { CreateNotificationUseCase } from "@/application/use-cases/notifications/create-notification";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { IdempotencyKey } from "@/domain/entities/idempotency-key";
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
    const idempotencyKeyHash = new UniqueEntityID();

    const ik = IdempotencyKey.create({
      key: idempotencyKeyHash.toString(),
      expiresAt: new Date(),
      responseBody: {},
      responseStatus: 201
    });

    await idempotencyKeyRepository.create(ik);

    const content = {
      title: "New notification",
      body: "This is a test notification."
    };

    const result = await sut.execute({
      input: {
        content,
        userId: "user123",
        externalId: "unique-external-id",
        priority: "HIGH",
        templateName: "WELCOME_EMAIL"
      },
      rawHeader: { ["idempotency-key"]: idempotencyKeyHash.toString() }
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

    const idempotencyKeyHash = new UniqueEntityID();

    const result = await sut.execute({
      input: {
        content,
        userId: "user123",
        externalId: "unique-external-id",
        priority: "HIGH",
        templateName: "WELCOME_EMAIL"
      },
      rawHeader: { ["idempotency-key"]: idempotencyKeyHash.toString() }
    });

    expect(result.isRight()).toBe(true);
    expect(notificationRepository.notifications[0].content).toEqual(content);
    expect(idempotencyKeyRepository.idempotencyKeys[0].key).toBe(
      idempotencyKeyHash.toString()
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
        input: {
          content: { title: "t", body: "b" },
          userId: "user123",
          externalId: "ext-rollback",
          priority: "HIGH",
          templateName: "WELCOME_EMAIL"
        },
        rawHeader: { ["idempotency-key"]: new UniqueEntityID().toString() }
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
