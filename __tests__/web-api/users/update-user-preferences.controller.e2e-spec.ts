import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { DatabaseModule } from "@/infra/database/database.module";
import { PrismaService } from "@/infra/database/prisma/prisma.service";
import { EventsService } from "@/infra/messaging/publishers/events.service";
import type { INestApplication } from "@nestjs/common";
import { PrismaUserFactory } from "__tests__/factories/user-builder";
import { PrismaUserPreferenceFactory } from "__tests__/factories/user-preference-builder";
import request from "supertest";

describe("Update user preference (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let prismaUserFactory: PrismaUserFactory;
  let prismaUserPreferenceFactory: PrismaUserPreferenceFactory;

  beforeAll(async () => {
    const { Test } = await import("@nestjs/testing");
    const { AppModule } = await import("@/infra/app.module.js");

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [PrismaUserFactory, PrismaUserPreferenceFactory]
    })
      .overrideProvider(EventsService)
      .useValue({
        emit: vi.fn().mockResolvedValue(undefined),
        emitHigh: vi.fn().mockResolvedValue(undefined),
        emitMedium: vi.fn().mockResolvedValue(undefined),
        emitLow: vi.fn().mockResolvedValue(undefined)
      })
      .compile();

    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);
    prismaUserFactory = moduleRef.get(PrismaUserFactory);
    prismaUserPreferenceFactory = moduleRef.get(PrismaUserPreferenceFactory);

    await app.init();
  });

  test("[PUT] /users/:userId/preferences", async () => {
    const userId = new UniqueEntityID();
    const user = await prismaUserFactory.build(userId);
    const userPrefs = await prismaUserPreferenceFactory.build(user.id, {
      allowEmail: true,
      allowSMS: true,
      allowPush: true
    });

    const newParams = {
      allowEmail: false,
      allowSMS: false,
      allowPush: false
    };

    const response = await request(app.getHttpServer())
      .put(`/users/${userId.toString()}/preferences`)
      .send(newParams);

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});

    const updatedPrefs = await prisma.userPreference.findUnique({
      where: { userId: userId.toString() }
    });

    expect(updatedPrefs).toMatchObject(newParams);
  });

  afterAll(async () => {
    await app.close();
  });
});
