-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('waiting', 'negotiating', 'matched');

-- AlterTable
ALTER TABLE "offers" DROP COLUMN "status";
ALTER TABLE "offers" ADD COLUMN "bookingStatus" "BookingStatus" NOT NULL DEFAULT 'waiting';

-- DropEnum
DROP TYPE "OfferStatus";

-- DropIndex if exists
DROP INDEX IF EXISTS "offers_status_idx";

-- CreateIndex
CREATE INDEX "offers_bookingStatus_idx" ON "offers"("bookingStatus");
