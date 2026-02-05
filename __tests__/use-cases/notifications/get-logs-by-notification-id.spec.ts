import { GetLogsByNotificationIdUseCase } from "@/application/use-cases/notifications/get-logs-by-notification-id";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { NotificationLogFactory } from "__tests__/factories/notification-log-builder";
import { InMemoryNotificationLogRepository } from "__tests__/repositories/in-memory-notification-log-repository";

let inMemoryNotificationLogRepository: InMemoryNotificationLogRepository;
let sut: GetLogsByNotificationIdUseCase;

describe("Get All Notifications", () => {
  beforeEach(() => {
    inMemoryNotificationLogRepository = new InMemoryNotificationLogRepository();
    sut = new GetLogsByNotificationIdUseCase(inMemoryNotificationLogRepository);
  });

  test("it should be able to return all logs for a notification", async () => {
    const notificationId = new UniqueEntityID();
    const otherNotificationId = new UniqueEntityID();

    const logs = [
      NotificationLogFactory.buildFailed(notificationId),
      NotificationLogFactory.buildFailed(notificationId),
      NotificationLogFactory.buildSuccess(notificationId),
      NotificationLogFactory.buildSuccess(otherNotificationId),
      NotificationLogFactory.buildSuccess(otherNotificationId)
    ];

    inMemoryNotificationLogRepository.createMany(logs);

    const result = await sut.execute(notificationId.toString());

    expect(result.length).toBe(3);
    expect(inMemoryNotificationLogRepository.notificationLogs).toHaveLength(5);
  });
});
