import { GetAllNotificationsByUserIdUseCase } from "@/application/use-cases/notifications/get-all-notifications";
import { NotificationFactory } from "__tests__/factories/notification-builder";
import { InMemoryNotificationRepository } from "__tests__/repositories/in-memory-notification-repository";

let inMemoryNotificationRepository: InMemoryNotificationRepository;
let sut: GetAllNotificationsByUserIdUseCase;

describe("Get All Notifications", () => {
  beforeEach(() => {
    inMemoryNotificationRepository = new InMemoryNotificationRepository();
    sut = new GetAllNotificationsByUserIdUseCase(
      inMemoryNotificationRepository
    );
  });

  test("it should be able to return all notifications", async () => {
    const notifications = [
      NotificationFactory.build(),
      NotificationFactory.build(),
      NotificationFactory.build()
    ];

    inMemoryNotificationRepository.restore(notifications);

    const result = await sut.execute();

    expect(inMemoryNotificationRepository.notifications).toHaveLength(3);
  });
});
