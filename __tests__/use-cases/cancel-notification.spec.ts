import { ConflictException } from "@/application/errors/conflict-exception";
import { NotFoundException } from "@/application/errors/not-found-exception";
import { CancelNotificationUseCase } from "@/application/use-cases/notifications/cancel-notification";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { NotificationFactory } from "__tests__/factories/notification-builder";
import { InMemoryNotificationRepository } from "__tests__/repositories/in-memory-notification-repository";

let notificationRepository: InMemoryNotificationRepository;
let sut: CancelNotificationUseCase;

describe("Cancel Notification", () => {
  beforeEach(() => {
    notificationRepository = new InMemoryNotificationRepository();
    sut = new CancelNotificationUseCase(notificationRepository);
  });

  it("should cancel a notification", async () => {
    const notification = NotificationFactory.build();

    await notificationRepository.create(notification);

    const result = await sut.execute(notification.id.toString());

    expect(result.isRight()).toBe(true);
    expect(notificationRepository.notifications[0].status).toEqual("CANCELED");
  });

  it("should not cancel a non-existing notification", async () => {
    const result = await sut.execute(new UniqueEntityID().toString());

    expect(result.isLeft()).toBe(true);
    expect(result.value).instanceOf(NotFoundException);
  });

  it("should not cancel if notification status isn't PENDING", async () => {
    const notification = NotificationFactory.build({ status: "PARTIAL" });

    await notificationRepository.create(notification);

    const result = await sut.execute(notification.id.toString());

    expect(result.isLeft()).toBe(true);
    expect(result.value).instanceOf(ConflictException);
  });
});
