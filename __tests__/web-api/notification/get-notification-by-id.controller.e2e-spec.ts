import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { DatabaseModule } from "@/infra/database/database.module";
import { PrismaService } from "@/infra/database/prisma/prisma.service";
import type { INestApplication } from "@nestjs/common";
import { PrismaNotificationFactory } from "__tests__/factories/notification-builder";
import { PrismaNotificationLogFactory } from "__tests__/factories/notification-log-builder";
import { PrismaUserFactory } from "__tests__/factories/user-builder";
import request from "supertest";

describe("Get notification by ID (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let prismaUserFactory: PrismaUserFactory;
  let prismaNotificationFactory: PrismaNotificationFactory;

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

    await app.init();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
    await prisma.notification.deleteMany();
  });

  test("[GET] /notifications/:id returns a specific notification", async () => {
    const userId = new UniqueEntityID();
    await prismaUserFactory.build(userId);

    const notificationId = new UniqueEntityID();
    const notification = await prismaNotificationFactory.build(
      {},
      notificationId,
      userId
    );

    const response = await request(app.getHttpServer()).get(
      `/notifications/${notificationId}`
    );

    expect(response.status).toBe(200);
    expect(response.body.id).toEqual(notification.id.toString());
  });

  test("[GET] /notifications/:id with invalid notification id", async () => {
    const response = await request(app.getHttpServer()).get(
      "/notifications/invalid-id"
    );

    expect(response.status).toBe(400);
  });

  test("[GET] /notifications/:id with non-existent notification id", async () => {
    const response = await request(app.getHttpServer()).get(
      `/notifications/${new UniqueEntityID().toString()}`
    );

    expect(response.status).toBe(404);
  });

  afterAll(async () => {
    await app.close();
  });
});
