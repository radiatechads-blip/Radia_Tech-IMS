ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "roundOff" double precision NOT NULL DEFAULT 0; ALTER TABLE "ProformaInvoice" ADD COLUMN IF NOT EXISTS "roundOff" double precision NOT NULL DEFAULT 0;
