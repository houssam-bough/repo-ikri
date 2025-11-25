/*
  Warnings:

  - You are about to drop the column `respondedAt` on the `proposals` table. All the data in the column will be lost.
  - You are about to drop the `notifications` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "DemandStatus" ADD VALUE 'matched';

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_userId_fkey";

-- DropIndex
DROP INDEX "proposals_createdAt_idx";

-- AlterTable
ALTER TABLE "demands" ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "proposals" DROP COLUMN "respondedAt";

-- DropTable
DROP TABLE "notifications";
