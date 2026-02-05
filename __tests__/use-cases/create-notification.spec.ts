import { ConflictException } from "@/application/errors/conflict-exception";
import { NotFoundException } from "@/application/errors/not-found-exception";
import { CreateNotificationUseCase } from "@/application/use-cases/notifications/create-notification";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { IdempotencyKey } from "@/domain/entities/idempotency-key";
import { Notification } from "@/domain/entities/notification";
import { NotificationPriority } from "@/domain/enums/notification-priority";
import { NotificationStatus } from "@/domain/enums/notification-status";
import { MESSAGE_PATTERNS } from "@/infra/messaging";
import { BadRequestException } from "@nestjs/common";
import { FakeEventsService } from "__tests__/doubles/fake-events-service";
import { IkFactory } from "__tests__/factories/ik-builder";
import { UserFactory } from "__tests__/factories/user-builder";
import { InMemoryIdempotencyKeyRepository } from "__tests__/repositories/in-memory-idempotency-key-repository";
import { InMemoryNotificationRepository } from "__tests__/repositories/in-memory-notification-repository";
import { InMemoryUnitOfWork } from "__tests__/repositories/in-memory-unit-of-work";
import { InMemoryUserRepository } from "__tests__/repositories/in-memory-user-repository";

let idempotencyKeyRepository: InMemoryIdempotencyKeyRepository;
let notificationRepository: InMemoryNotificationRepository;
let userRepository: InMemoryUserRepository;
let eventsService: FakeEventsService;
let unitOfWork: InMemoryUnitOfWork;
let sut: CreateNotificationUseCase;

describe("Create Notification", () => {
  beforeEach(() => {
    idempotencyKeyRepository = new InMemoryIdempotencyKeyRepository();
    notificationRepository = new InMemoryNotificationRepository();
    userRepository = new InMemoryUserRepository();
    eventsService = new FakeEventsService();
    unitOfWork = new InMemoryUnitOfWork([
      idempotencyKeyRepository,
      notificationRepository
    ]);

    sut = new CreateNotificationUseCase(
      idempotencyKeyRepository,
      notificationRepository,
      userRepository,
      eventsService,
      unitOfWork
    );
  });

  test("it should throw an error when idempotency key already exists", async () => {
    const user = UserFactory.build();

    const userCreated = await userRepository.create(user);

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
        userId: userCreated.id.toString(),
        externalId: "unique-external-id",
        priority: NotificationPriority.HIGH,
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
    const user = UserFactory.build();

    await userRepository.create(user);

    const result = await sut.execute({
      input: {
        content,
        userId: user.id.toString(),
        externalId: "unique-external-id",
        priority: NotificationPriority.HIGH,
        templateName: "WELCOME_EMAIL"
      },
      rawHeader: { ["idempotency-key"]: idempotencyKeyHash.toString() }
    });

    expect(result.isRight()).toBe(true);
    expect(notificationRepository.notifications[0].content).toEqual(content);
    expect(idempotencyKeyRepository.idempotencyKeys[0].key).toBe(
      idempotencyKeyHash.toString()
    );

    // ✅ Verifica se o evento foi emitido
    expect(eventsService.getEventCount()).toBe(1);
    expect(eventsService.hasEmittedEvent(MESSAGE_PATTERNS.NOTIFICATION_PENDING)).toBe(true);

    const emittedEvent = eventsService.getEmittedEvent(MESSAGE_PATTERNS.NOTIFICATION_PENDING);
    expect(emittedEvent?.priority).toBe("HIGH");
    expect(emittedEvent?.data.userId).toBe(user.id.toString());
  });

  test("it should rollback when notification creation fails (atomicity)", async () => {
    const user = UserFactory.build();
    await userRepository.create(user);

    notificationRepository = new FailingNotificationRepository();
    unitOfWork = new InMemoryUnitOfWork([
      idempotencyKeyRepository,
      notificationRepository
    ]);

    sut = new CreateNotificationUseCase(
      idempotencyKeyRepository,
      notificationRepository,
      userRepository,
      eventsService,
      unitOfWork
    );

    await expect(
      sut.execute({
        input: {
          content: { title: "t", body: "b" },
          userId: user.id.toString(),
          externalId: "ext-rollback",
          priority: NotificationPriority.HIGH,
          templateName: "WELCOME_EMAIL"
        },
        rawHeader: { ["idempotency-key"]: new UniqueEntityID().toString() }
      })
    ).rejects.toThrow("notification create failed");

    expect(idempotencyKeyRepository.idempotencyKeys).toHaveLength(0);
    expect(notificationRepository.notifications).toHaveLength(0);
  });

  test("it should throw an error if idempotency key isn't a valid UUID", async () => {
    const content = {
      title: "New notification",
      body: "This is a test notification."
    };

    const result = await sut.execute({
      input: {
        content,
        userId: "user123",
        externalId: "unique-external-id",
        priority: NotificationPriority.HIGH,
        templateName: "WELCOME_EMAIL"
      },
      rawHeader: { ["idempotency-key"]: "invalid-idempotency-key" }
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(BadRequestException);
  });

  test("it should throw an error if externalId is missing", async () => {
    const content = {
      title: "New notification",
      body: "This is a test notification."
    };

    const result = await sut.execute({
      input: {
        content,
        userId: "user123",
        externalId: "",
        priority: NotificationPriority.HIGH,
        templateName: "WELCOME_EMAIL"
      },
      rawHeader: { ["idempotency-key"]: new UniqueEntityID().toString() }
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(BadRequestException);
  });

  test("it should return cached response status if already a notification with the same idempotency key", async () => {
    const externalId = "duplicate-external-id";

    const user = UserFactory.build();
    const userCreated = await userRepository.create(user);

    const content = {
      title: "New notification",
      body: "This is a test notification."
    };

    const notification = Notification.create({
      content,
      userId: userCreated.id,
      externalId,
      priority: NotificationPriority.HIGH,
      templateName: "WELCOME_EMAIL",
      status: NotificationStatus.PENDING
    });

    await notificationRepository.create(notification);

    const fakeIk = new UniqueEntityID().toString();
    const ik = IkFactory.build(fakeIk);
    ik.responseStatus = 201;
    ik.responseBody = notification;

    await idempotencyKeyRepository.create(ik);

    const result = await sut.execute({
      input: {
        content,
        userId: userCreated.id.toString(),
        externalId,
        priority: NotificationPriority.HIGH,
        templateName: "WELCOME_EMAIL"
      },
      rawHeader: { ["idempotency-key"]: fakeIk }
    });

    expect(result.isRight()).toBe(true);
    expect(notificationRepository.notifications[0].id).toEqual(notification.id);
    expect(idempotencyKeyRepository.idempotencyKeys).toHaveLength(1);
    expect(notificationRepository.notifications).toHaveLength(1);
  });

  test("it should not be able to create a notification if user doesn't exist", async () => {
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
        priority: NotificationPriority.HIGH,
        templateName: "WELCOME_EMAIL"
      },
      rawHeader: { ["idempotency-key"]: idempotencyKeyHash.toString() }
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(NotFoundException);
    expect(idempotencyKeyRepository.idempotencyKeys).toHaveLength(0);
  });

  test("it should return cached notification if it exists", async () => {
    const user = UserFactory.build();
    const userCreated = await userRepository.create(user);

    await userRepository.create(user);

    const content = {
      title: "New notification",
      body: "This is a test notification."
    };

    const notification = Notification.create({
      content,
      userId: userCreated.id,
      externalId: "duplicate-external-id",
      priority: NotificationPriority.HIGH,
      templateName: "WELCOME_EMAIL",
      status: NotificationStatus.PENDING
    });

    await notificationRepository.create(notification);

    const result = await sut.execute({
      input: {
        content,
        userId: userCreated.id.toString(),
        externalId: "duplicate-external-id",
        priority: NotificationPriority.HIGH,
        templateName: "WELCOME_EMAIL"
      },
      rawHeader: { ["idempotency-key"]: new UniqueEntityID().toString() }
    });

    expect(result.isRight()).toBe(true);
    expect(notificationRepository.notifications[0].id).toEqual(notification.id);
    expect(idempotencyKeyRepository.idempotencyKeys).toHaveLength(1);
    expect(notificationRepository.notifications).toHaveLength(1);
  });

  class FailingNotificationRepository extends InMemoryNotificationRepository {
    async create(...args: any[]) {
      throw new Error("notification create failed");
      return {} as any;
    }
  }
});
