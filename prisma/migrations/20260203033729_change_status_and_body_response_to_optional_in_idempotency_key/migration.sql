-- AlterTable
ALTER TABLE "idempotency_keys" ALTER COLUMN "responseStatus" DROP NOT NULL,
ALTER COLUMN "responseBody" DROP NOT NULL;
