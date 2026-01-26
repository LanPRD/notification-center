import type { Env } from "@/env";
import {
  Inject,
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    @Inject(ConfigService)
    config: ConfigService<Env, true>
  ) {
    const databaseUrl = config.get("DATABASE_URL", { infer: true });
    const databaseSchema = config.get("DATABASE_SCHEMA", { infer: true });

    const baseURL = databaseUrl.split("?")[0];

    const adapter = new PrismaPg(
      { connectionString: baseURL },
      { schema: databaseSchema || "public" }
    );

    super({
      log: ["query", "warn", "error"],
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
