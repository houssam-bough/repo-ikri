/*
  Warnings:

  - The values [pending,open,rejected] on the enum `DemandStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [User] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DemandStatus_new" AS ENUM ('waiting', 'negotiating', 'matched');
ALTER TABLE "demands" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "demands" ALTER COLUMN "status" TYPE "DemandStatus_new" USING ("status"::text::"DemandStatus_new");
ALTER TYPE "DemandStatus" RENAME TO "DemandStatus_old";
ALTER TYPE "DemandStatus_new" RENAME TO "DemandStatus";
DROP TYPE "DemandStatus_old";
ALTER TABLE "demands" ALTER COLUMN "status" SET DEFAULT 'waiting';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('Admin', 'Farmer', 'Provider', 'Both');
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'Farmer';
COMMIT;

-- AlterTable
ALTER TABLE "demands" ADD COLUMN     "area" DOUBLE PRECISION,
ADD COLUMN     "cropType" TEXT,
ADD COLUMN     "serviceType" TEXT,
ALTER COLUMN "status" SET DEFAULT 'waiting';

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "audioDuration" DOUBLE PRECISION,
ADD COLUMN     "audioUrl" TEXT,
ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "fileType" TEXT,
ADD COLUMN     "fileUrl" TEXT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'Farmer';
