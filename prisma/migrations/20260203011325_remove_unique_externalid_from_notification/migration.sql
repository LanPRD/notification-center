/*
  Warnings:

  - A unique constraint covering the columns `[key]` on the table `idempotency_keys` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "notifications_externalId_key";

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_keys_key_key" ON "idempotency_keys"("key");
