import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { DatabaseModule } from "@/infra/database/database.module";
import { PrismaService } from "@/infra/database/prisma/prisma.service";
import type { INestApplication } from "@nestjs/common";
import { PrismaNotificationFactory } from "__tests__/factories/notification-builder";
import { PrismaUserFactory } from "__tests__/factories/user-builder";
import request from "supertest";

describe("Cancel notification (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let prismaUserFactory: PrismaUserFactory;
  let prismaNotificationFactory: PrismaNotificationFactory;

  beforeAll(async () => {
    const { Test } = await import("@nestjs/testing");
    const { AppModule } = await import("@/infra/app.module.js");

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [PrismaUserFactory, PrismaNotificationFactory]
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

  test("[GET] /notifications returns all notifications", async () => {
    const userId = new UniqueEntityID();

    await prismaUserFactory.build(userId);

    await prismaNotificationFactory.build({}, new UniqueEntityID(), userId);
    await prismaNotificationFactory.build({}, new UniqueEntityID(), userId);
    await prismaNotificationFactory.build({}, new UniqueEntityID(), userId);

    const response = await request(app.getHttpServer()).get("/notifications");

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(3);
    expect(response.body[0].userId).toEqual(userId.toString());
  });

  afterAll(async () => {
    await app.close();
  });
});
