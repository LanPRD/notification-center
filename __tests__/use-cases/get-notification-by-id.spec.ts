import { NotFoundException } from "@/application/errors/not-found-exception";
import { GetNotificationByIdUseCase } from "@/application/use-cases/notifications/get-notification-by-id";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { notificationBuilder } from "__tests__/factories/user-builder copy";
import { InMemoryNotificationRepository } from "__tests__/repositories/in-memory-notification-repository";

let notificationRepository: InMemoryNotificationRepository;
let sut: GetNotificationByIdUseCase;

describe("Create Notification", () => {
  beforeEach(() => {
    notificationRepository = new InMemoryNotificationRepository();
    sut = new GetNotificationByIdUseCase(notificationRepository);
  });

  it("should be able to get a notification by id", async () => {
    const notification = notificationBuilder(new UniqueEntityID());

    await notificationRepository.create(notification);

    const result = await sut.execute(notification.id.toString());

    expect(result.isRight()).toBe(true);
    expect(result.value).toEqual({ notification: notification });
  });

  it("it should throw an error if notification doesn't exist", async () => {
    const result = await sut.execute(new UniqueEntityID().toString());
    expect(result.isLeft()).toBe(true);
    expect(result.value).instanceOf(NotFoundException);
  });
});
