/*
  Warnings:

  - A unique constraint covering the columns `[userId,externalId]` on the table `notifications` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "NotificationStatus" ADD VALUE 'PARTIAL';

-- CreateIndex
CREATE UNIQUE INDEX "notifications_userId_externalId_key" ON "notifications"("userId", "externalId");
