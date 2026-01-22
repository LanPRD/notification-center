import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import pg from "pg";

const schemaId = randomUUID();

function generateDatabaseURL(schema: string) {
  if (!process.env.DATABASE_URL) {
    throw new Error("No database URL provided.");
  }

  const url = new URL(process.env.DATABASE_URL);
  url.searchParams.set("schema", schema);

  return url.toString();
}

export let prisma: PrismaClient;

beforeAll(async () => {
  const databaseURL = generateDatabaseURL(schemaId);
  process.env.DATABASE_URL = databaseURL;

  execSync("npx prisma migrate deploy");

  // Criar pool de conexão
  const pool = new pg.Pool({ connectionString: databaseURL });
  const adapter = new PrismaPg(pool);

  // Passar adapter para o PrismaClient
  prisma = new PrismaClient({ adapter });

  await prisma.$connect();
});

afterAll(async () => {
  if (!prisma) return;

  try {
    await prisma.$executeRawUnsafe(
      `DROP SCHEMA IF EXISTS "${schemaId}" CASCADE`
    );
  } catch (error) {
    console.error(`Failed to drop schema ${schemaId}:`, error);
  } finally {
    await prisma.$disconnect();
  }
});
