import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { NotificationPriority } from "@/domain/enums/notification-priority";
import { PrismaUserMapper } from "@/infra/database/mappers/prisma-user-mapper";
import { PrismaService } from "@/infra/database/prisma/prisma.service";
import type { CreateNotificationBodyDto } from "@/infra/http/dtos/notification.dto";
import type { INestApplication } from "@nestjs/common";
import { UserFactory } from "__tests__/factories/user-builder";
import request from "supertest";

describe("Create notification (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const { Test } = await import("@nestjs/testing");
    const { AppModule } = await import("@/infra/app.module.js");

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);

    await app.init();
  });

  test("[POST] /notifications creates a notification", async () => {
    const user = UserFactory.build();

    const userCreated = await prisma.user.create({
      data: PrismaUserMapper.toPrisma(user)
    });

    const externalId = "unique-external-id";
    const idempotencyKey = new UniqueEntityID();

    const body: CreateNotificationBodyDto = {
      userId: userCreated.id,
      templateName: "welcome_email",
      content: { firstName: "John", signupDate: "2024-01-01" },
      priority: NotificationPriority.HIGH,
      externalId: externalId
    };

    const result = await request(app.getHttpServer())
      .post("/notifications")
      .set("Idempotency-Key", idempotencyKey.toString())
      .send(body);

    expect(result.status).toBe(201);

    const count = await prisma.notification.count({
      where: {
        userId: userCreated.id,
        externalId: body.externalId
      }
    });

    expect(count).toBe(1);
  });

  test("[POST] /notification race: same idempotency key", async () => {
    const { body, userCreated, idempotencyKey } = await prepareToTest();

    const server = app.getHttpServer();

    const calls = Array.from({ length: 50 }, () => {
      return request(server)
        .post("/notifications")
        .set("Idempotency-Key", idempotencyKey.toString())
        .send(body);
    });

    const results = await Promise.all(calls);

    const byStatus = results.reduce<Record<number, number>>((acc, res) => {
      acc[res.status] = (acc[res.status] || 0) + 1;
      return acc;
    }, {});

    console.log("By status:", byStatus);

    const notificationCount = await prisma.notification.count({
      where: {
        userId: userCreated.id,
        externalId: body.externalId
      }
    });

    const ikCount = await prisma.idempotencyKey.count({
      where: {
        key: idempotencyKey.toString()
      }
    });

    expect(notificationCount).toBe(1);
    expect(ikCount).toBe(1);
  });

  // test("[POST] /notifications race: same externalId, different idempotency keys", async () => {
  //   const { body, userCreated: user, idempotencyKey } = await prepareToTest();

  //   const server = app.getHttpServer();

  //   const calls = Array.from({ length: 30 }, (_, i) =>
  //     request(server)
  //       .post("/notifications")
  //       .set("Idempotency-Key", new UniqueEntityID().toString()) // só pra variar
  //       .send(body)
  //   );

  //   const results = await Promise.all(calls);

  //   const notifCount = await prisma.notification.count({
  //     where: { userId: user.id, externalId: body.externalId }
  //   });

  //   expect(notifCount).toBe(1);
  // });

  afterAll(async () => {
    await app.close();
  });

  async function prepareToTest() {
    await prisma.notification.deleteMany();
    await prisma.idempotencyKey.deleteMany();
    await prisma.user.deleteMany();

    const user = UserFactory.build();

    const userCreated = await prisma.user.create({
      data: PrismaUserMapper.toPrisma(user)
    });

    const externalId = "unique-external-id";
    const idempotencyKey = new UniqueEntityID();

    const body: CreateNotificationBodyDto = {
      userId: userCreated.id,
      templateName: "welcome_email",
      content: { firstName: "John", signupDate: "2024-01-01" },
      priority: NotificationPriority.HIGH,
      externalId: externalId
    };

    return { body, idempotencyKey, userCreated };
  }
});
