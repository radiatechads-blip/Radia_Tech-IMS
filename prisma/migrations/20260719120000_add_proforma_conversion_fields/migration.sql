-- AlterTable
ALTER TABLE "ProformaInvoice"
ADD COLUMN "convertedToTaxInvoice" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "convertedInvoiceId" TEXT,
ADD COLUMN "convertedInvoiceNumber" TEXT,
ADD COLUMN "convertedFromProforma" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "sourceProformaNumber" TEXT;
