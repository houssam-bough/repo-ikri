/*
  Warnings:

  - Added the required column `address` to the `offers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city` to the `offers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable: Add columns with default values for existing rows
ALTER TABLE "offers" ADD COLUMN "city" TEXT NOT NULL DEFAULT 'Casablanca';
ALTER TABLE "offers" ADD COLUMN "address" TEXT NOT NULL DEFAULT 'Adresse non spécifiée';

-- Remove defaults so future inserts must provide values
ALTER TABLE "offers" ALTER COLUMN "city" DROP DEFAULT;
ALTER TABLE "offers" ALTER COLUMN "address" DROP DEFAULT;

