import { PrismaService } from "@/infra/database/prisma/prisma.service";
import { EventsService } from "@/infra/messaging/publishers/events.service";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";

describe("Create user (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const { Test } = await import("@nestjs/testing");
    const { AppModule } = await import("@/infra/app.module.js");

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
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

    await app.init();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  test("[POST] /user", async () => {
    const email = "test@example.com";

    const response = await request(app.getHttpServer()).post("/users").send({
      email: email,
      phoneNumber: "+1234567890",
      pushToken: "test-token"
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("email", email);

    const userOnDatabase = await prisma.user.findUnique({ where: { email } });

    expect(userOnDatabase).toBeTruthy();
  });

  test("[POST] /user with invalid email", async () => {
    const response = await request(app.getHttpServer()).post("/users").send({
      email: "invalid_email",
      phoneNumber: "+1234567890",
      pushToken: "test-token"
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Validation failed");
  });

  test("[POST] /user with invalid phone number", async () => {
    const response = await request(app.getHttpServer()).post("/users").send({
      email: "test@example.com",
      phoneNumber: "invalid_phone_number",
      pushToken: "test-token"
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
  });

  afterAll(async () => {
    await app.close();
  });
});
