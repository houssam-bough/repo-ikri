/*
  Warnings:

  - The values [accepted,closed] on the enum `DemandStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [refused,auto_rejected] on the enum `ProposalStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `proposedPrice` on the `proposals` table. All the data in the column will be lost.
  - Added the required column `price` to the `proposals` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DemandStatus_new" AS ENUM ('pending', 'open', 'matched', 'rejected');
ALTER TABLE "demands" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "demands" ALTER COLUMN "status" TYPE "DemandStatus_new" USING ("status"::text::"DemandStatus_new");
ALTER TYPE "DemandStatus" RENAME TO "DemandStatus_old";
ALTER TYPE "DemandStatus_new" RENAME TO "DemandStatus";
DROP TYPE "DemandStatus_old";
ALTER TABLE "demands" ALTER COLUMN "status" SET DEFAULT 'pending';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ProposalStatus_new" AS ENUM ('pending', 'accepted', 'rejected');
ALTER TABLE "proposals" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "proposals" ALTER COLUMN "status" TYPE "ProposalStatus_new" USING ("status"::text::"ProposalStatus_new");
ALTER TYPE "ProposalStatus" RENAME TO "ProposalStatus_old";
ALTER TYPE "ProposalStatus_new" RENAME TO "ProposalStatus";
DROP TYPE "ProposalStatus_old";
ALTER TABLE "proposals" ALTER COLUMN "status" SET DEFAULT 'pending';
COMMIT;

-- AlterTable
ALTER TABLE "proposals" DROP COLUMN "proposedPrice",
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL;
