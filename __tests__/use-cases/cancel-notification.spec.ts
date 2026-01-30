import { ConflictException } from "@/application/errors/conflict-exception";
import { NotFoundException } from "@/application/errors/not-found-exception";
import { CancelNotificationUseCase } from "@/application/use-cases/notifications/cancel-notification";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { notificationBuilder } from "__tests__/factories/user-builder copy";
import { InMemoryNotificationRepository } from "__tests__/repositories/in-memory-notification-repository";

let notificationRepository: InMemoryNotificationRepository;
let sut: CancelNotificationUseCase;

describe("Cancel Notification", () => {
  beforeEach(() => {
    notificationRepository = new InMemoryNotificationRepository();
    sut = new CancelNotificationUseCase(notificationRepository);
  });

  it("should cancel a notification", async () => {
    const notification = notificationBuilder();

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
    const notification = notificationBuilder({ status: "PARTIAL" });

    await notificationRepository.create(notification);

    const result = await sut.execute(notification.id.toString());

    expect(result.isLeft()).toBe(true);
    expect(result.value).instanceOf(ConflictException);
  });
});
