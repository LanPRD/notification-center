import { PrismaService } from "@/infra/database/prisma/prisma.service";
import { EventsService } from "@/infra/messaging/publishers/events.service";
import type { INestApplication } from "@nestjs/common";

describe.skip("Cancel notification (E2E)", () => {
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
        emit: vi.fn(),
        emitHigh: vi.fn(),
        emitMedium: vi.fn(),
        emitLow: vi.fn()
      })
      .compile();

    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });
});
