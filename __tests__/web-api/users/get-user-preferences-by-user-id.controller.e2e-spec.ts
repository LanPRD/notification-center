import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { DatabaseModule } from "@/infra/database/database.module";
import { PrismaUserPreferenceMapper } from "@/infra/database/mappers/prisma-user-preference-mapper";
import { PrismaService } from "@/infra/database/prisma/prisma.service";
import { UserPreferencePresenter } from "@/infra/http/presenters/user-preference-presenter";
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
    }).compile();

    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);
    prismaUserFactory = moduleRef.get(PrismaUserFactory);
    prismaUserPreferenceFactory = moduleRef.get(PrismaUserPreferenceFactory);

    await app.init();
  });

  test("[GET] /users/:userId/preferences", async () => {
    const userId = new UniqueEntityID();
    const user = await prismaUserFactory.build(userId);
    const userPrefs = await prismaUserPreferenceFactory.build(user.id, {
      allowEmail: true,
      allowSMS: true,
      allowPush: true
    });

    const response = await request(app.getHttpServer()).get(
      `/users/${userId.toString()}/preferences`
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual(UserPreferencePresenter.toHTTP(userPrefs));

    const updatedPrefs = await prisma.userPreference.findUnique({
      where: { userId: userId.toString() }
    });

    expect(updatedPrefs).toBeTruthy();
    expect(userPrefs).toMatchObject(
      PrismaUserPreferenceMapper.toDomain(updatedPrefs!)
    );
  });

  afterAll(async () => {
    await app.close();
  });
});
