import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { DatabaseModule } from "@/infra/database/database.module";
import { PrismaService } from "@/infra/database/prisma/prisma.service";
import { NotificationLogPresenter } from "@/infra/http/presenters/notification-log-presenter";
import type { INestApplication } from "@nestjs/common";
import { PrismaNotificationFactory } from "__tests__/factories/notification-builder";
import { PrismaNotificationLogFactory } from "__tests__/factories/notification-log-builder";
import { PrismaUserFactory } from "__tests__/factories/user-builder";
import request from "supertest";

describe("Get logs by notification ID (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let prismaUserFactory: PrismaUserFactory;
  let prismaNotificationFactory: PrismaNotificationFactory;
  let prismaNotificationLogFactory: PrismaNotificationLogFactory;

  beforeAll(async () => {
    const { Test } = await import("@nestjs/testing");
    const { AppModule } = await import("@/infra/app.module.js");

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [
        PrismaUserFactory,
        PrismaNotificationFactory,
        PrismaNotificationLogFactory
      ]
    }).compile();

    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);
    prismaUserFactory = moduleRef.get(PrismaUserFactory);
    prismaNotificationFactory = moduleRef.get(PrismaNotificationFactory);
    prismaNotificationLogFactory = moduleRef.get(PrismaNotificationLogFactory);

    await app.init();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
    await prisma.notification.deleteMany();
  });

  test("[GET] /notifications/:notificationId/logs returns logs for a specific notification", async () => {
    const userId = new UniqueEntityID();
    await prismaUserFactory.build(userId);

    const notificationId = new UniqueEntityID();
    await prismaNotificationFactory.build({}, notificationId, userId);

    const logId = new UniqueEntityID();
    const log = await prismaNotificationLogFactory.buildSuccessLog(
      notificationId,
      {},
      logId
    );

    const response = await request(app.getHttpServer()).get(
      `/notifications/${notificationId}/logs`
    );

    expect(response.status).toBe(200);
    expect(response.body[0].id).toEqual(log.id.toString());
  });

  test("[GET] /notifications/:notificationId/logs with invalid notificationId", async () => {
    const response = await request(app.getHttpServer()).get(
      "/notifications/invalid/logs"
    );

    expect(response.status).toBe(400);
  });

  afterAll(async () => {
    await app.close();
  });
});
