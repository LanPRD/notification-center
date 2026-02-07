import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { NotificationStatus } from "@/domain/enums/notification-status";
import { DatabaseModule } from "@/infra/database/database.module";
import { PrismaService } from "@/infra/database/prisma/prisma.service";
import { EventsService } from "@/infra/messaging/publishers/events.service";
import type { INestApplication } from "@nestjs/common";
import { PrismaNotificationFactory } from "__tests__/factories/notification-builder";
import { PrismaUserFactory } from "__tests__/factories/user-builder";
import request from "supertest";

describe("Cancel notification (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let prismaUserFactory: PrismaUserFactory;
  let prismaNotificationFactory: PrismaNotificationFactory;
  let eventsServiceMock: {
    emit: ReturnType<typeof vi.fn>;
    emitHigh: ReturnType<typeof vi.fn>;
    emitMedium: ReturnType<typeof vi.fn>;
    emitLow: ReturnType<typeof vi.fn>;
  };

  beforeAll(async () => {
    const { Test } = await import("@nestjs/testing");
    const { AppModule } = await import("@/infra/app.module.js");

    eventsServiceMock = {
      emit: vi.fn().mockResolvedValue(undefined),
      emitHigh: vi.fn().mockResolvedValue(undefined),
      emitMedium: vi.fn().mockResolvedValue(undefined),
      emitLow: vi.fn().mockResolvedValue(undefined)
    };

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [PrismaUserFactory, PrismaNotificationFactory]
    })
      .overrideProvider(EventsService)
      .useValue(eventsServiceMock)
      .compile();

    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);
    prismaUserFactory = moduleRef.get(PrismaUserFactory);
    prismaNotificationFactory = moduleRef.get(PrismaNotificationFactory);

    await app.init();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
    await prisma.notification.deleteMany();
  });

  test("[PATCH] /notifications/:id/cancel cancels a notification", async () => {
    const userId = new UniqueEntityID();
    const user = await prismaUserFactory.build(userId);

    const notificationId = new UniqueEntityID();
    const notification = await prismaNotificationFactory.build(
      {},
      notificationId,
      userId
    );

    const result = await request(app.getHttpServer())
      .patch(`/notifications/${notificationId}/cancel`)
      .send();

    expect(result.status).toBe(200);
  });

  test("[PATCH] /notifications/:id/cancel continues if emitLow fails", async () => {
    eventsServiceMock.emitLow.mockRejectedValue(new Error("RabbitMQ failed"));

    const userId = new UniqueEntityID();
    const user = await prismaUserFactory.build(userId);

    const notificationId = new UniqueEntityID();
    const notification = await prismaNotificationFactory.build(
      {},
      notificationId,
      userId
    );

    const result = await request(app.getHttpServer())
      .patch(`/notifications/${notificationId}/cancel`)
      .send();

    expect(result.status).toBe(200);
  });

  test("[PATCH] /notifications/:id/cancel with invalid notification id", async () => {
    const result = await request(app.getHttpServer())
      .patch("/notifications/invalid-id/cancel")
      .send();

    expect(result.status).toBe(400);
  });

  test("[PATCH] /notifications/:id/cancel with invalid status", async () => {
    const userId = new UniqueEntityID();
    const user = await prismaUserFactory.build(userId);

    const notificationId = new UniqueEntityID();
    const notification = await prismaNotificationFactory.build(
      { status: NotificationStatus.PARTIAL },
      notificationId,
      userId
    );

    const result = await request(app.getHttpServer())
      .patch(`/notifications/${notificationId}/cancel`)
      .send();

    expect(result.status).toBe(409);
  });

  afterEach(() => {
    vi.clearAllMocks();
    eventsServiceMock.emitLow.mockResolvedValue(undefined);
  });

  afterAll(async () => {
    await app.close();
  });
});
