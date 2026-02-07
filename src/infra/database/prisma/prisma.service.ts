import { EnvService } from "@/infra/env/env.service";
import {
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit
} from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(env: EnvService) {
    const databaseUrl = env.get("DATABASE_URL");
    const databaseSchema = env.get("DATABASE_SCHEMA");

    const baseURL = databaseUrl.split("?")[0];

    const adapter = new PrismaPg(
      { connectionString: baseURL },
      { schema: databaseSchema || "public" }
    );

    super({
      log: ["warn", "error"],
      adapter
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
