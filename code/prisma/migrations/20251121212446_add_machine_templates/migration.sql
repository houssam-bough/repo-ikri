-- AlterTable
ALTER TABLE "offers" ADD COLUMN     "customFields" JSONB,
ADD COLUMN     "machineTemplateId" TEXT;

-- CreateTable
CREATE TABLE "machine_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fieldDefinitions" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "machine_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "machine_templates_name_key" ON "machine_templates"("name");

-- CreateIndex
CREATE INDEX "machine_templates_name_idx" ON "machine_templates"("name");

-- CreateIndex
CREATE INDEX "machine_templates_isActive_idx" ON "machine_templates"("isActive");

-- CreateIndex
CREATE INDEX "offers_machineTemplateId_idx" ON "offers"("machineTemplateId");

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_machineTemplateId_fkey" FOREIGN KEY ("machineTemplateId") REFERENCES "machine_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
