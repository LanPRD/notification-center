import type { INestApplication } from "@nestjs/common";
import request from "supertest";

// describe("Create user (E2E)", () => {
//   let app: INestApplication;
//   let prisma: PrismaService;

//   beforeAll(async () => {
//     const { Test } = await import("@nestjs/testing");
//     const { AppModule } = await import("@/app.module.js");

//     const moduleRef = await Test.createTestingModule({
//       imports: [AppModule]
//     }).compile();

//     app = moduleRef.createNestApplication();
//     prisma = moduleRef.get(PrismaService);

//     await app.init();
//   });

//   test("[POST] /users", async () => {
//     const email = "test@example.com";

//     const response = await request(app.getHttpServer()).post("/users").send({
//       email: email,
//       phoneNumber: "+1234567890",
//       pushToken: "test-token"
//     });

//     expect(response.status).toBe(201);
//     expect(response.body).toHaveProperty("email", email);

//     const userOnDatabase = await prisma.user.findUnique({ where: { email } });

//     expect(userOnDatabase).toBeTruthy();
//   });

//   afterAll(async () => {
//     await app.close();
//   });
// });
