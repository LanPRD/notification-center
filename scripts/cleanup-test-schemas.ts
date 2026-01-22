/* eslint-disable camelcase */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import { Pool } from "pg";

async function cleanupTestSchemas() {
  // Criar pool e adapter
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // Busca APENAS schemas com formato UUID (gerados pelos testes)
    const schemas = await prisma.$queryRaw<Array<{ schema_name: string }>>`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    `;

    if (schemas.length === 0) {
      console.log("✅ No test schemas found to delete");
      return;
    }

    console.log(`Found ${schemas.length} test schemas to delete:`);
    schemas.forEach(s => console.log(`  - ${s.schema_name}`));

    console.log(
      "\n⚠️  About to delete these schemas in 3 seconds... (Ctrl+C to cancel)"
    );
    await new Promise(resolve => setTimeout(resolve, 3000));

    for (const { schema_name } of schemas) {
      console.log(`Dropping schema: ${schema_name}`);
      await prisma.$executeRawUnsafe(
        `DROP SCHEMA IF EXISTS "${schema_name}" CASCADE`
      );
    }

    console.log("\n✅ Cleanup complete!");
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

cleanupTestSchemas();
