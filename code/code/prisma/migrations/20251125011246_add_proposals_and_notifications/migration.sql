/*
  Warnings:

  - The values [matched] on the enum `DemandStatus` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `address` to the `demands` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city` to the `demands` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `demands` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `demands` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('pending', 'accepted', 'refused', 'auto_rejected');

-- AlterEnum
BEGIN;
CREATE TYPE "DemandStatus_new" AS ENUM ('pending', 'open', 'accepted', 'closed', 'rejected');
ALTER TABLE "demands" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "demands" ALTER COLUMN "status" TYPE "DemandStatus_new" USING ("status"::text::"DemandStatus_new");
ALTER TYPE "DemandStatus" RENAME TO "DemandStatus_old";
ALTER TYPE "DemandStatus_new" RENAME TO "DemandStatus";
DROP TYPE "DemandStatus_old";
ALTER TABLE "demands" ALTER COLUMN "status" SET DEFAULT 'pending';
COMMIT;

-- AlterTable
ALTER TABLE "demands" ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ALTER COLUMN "description" SET NOT NULL;

-- CreateTable
CREATE TABLE "proposals" (
    "id" TEXT NOT NULL,
    "demandId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "proposedPrice" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "relatedDemandId" TEXT,
    "relatedProposalId" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "proposals_demandId_idx" ON "proposals"("demandId");

-- CreateIndex
CREATE INDEX "proposals_providerId_idx" ON "proposals"("providerId");

-- CreateIndex
CREATE INDEX "proposals_status_idx" ON "proposals"("status");

-- CreateIndex
CREATE INDEX "proposals_createdAt_idx" ON "proposals"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_read_idx" ON "notifications"("read");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "demands_city_idx" ON "demands"("city");

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "demands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
