-- AlterTable
ALTER TABLE "proposals" ADD COLUMN     "counterOffers" JSONB DEFAULT '[]',
ADD COLUMN     "lastCounterBy" TEXT,
ADD COLUMN     "negotiationRound" INTEGER NOT NULL DEFAULT 0;
