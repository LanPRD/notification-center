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
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL!
    });

    super({
      log: ["query", "warn", "error"],
      adapter
    });
  }
  onModuleDestroy() {
    return this.$disconnect();
  }

  onModuleInit() {
    return this.$connect();
  }
}
