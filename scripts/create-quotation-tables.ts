import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL or DIRECT_URL is required to connect to the database.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Quotation" (
      "id" TEXT NOT NULL,
      "documentType" TEXT NOT NULL DEFAULT 'quotation',
      "billType" TEXT NOT NULL DEFAULT 'Quotation',
      "invoiceNumber" TEXT NOT NULL,
      "convertedToTaxInvoice" BOOLEAN NOT NULL DEFAULT false,
      "convertedInvoiceId" TEXT,
      "convertedInvoiceNumber" TEXT,
      "convertedFromProforma" BOOLEAN NOT NULL DEFAULT false,
      "sourceProformaNumber" TEXT,
      "invoiceDate" TIMESTAMP(3) NOT NULL,
      "dueDate" TIMESTAMP(3),
      "partyName" TEXT NOT NULL,
      "contactPerson" TEXT NOT NULL DEFAULT '',
      "email" TEXT NOT NULL DEFAULT '',
      "phone" TEXT NOT NULL DEFAULT '',
      "city" TEXT NOT NULL DEFAULT '',
      "pincode" TEXT NOT NULL DEFAULT '',
      "gstin" TEXT NOT NULL DEFAULT '',
      "state" TEXT NOT NULL DEFAULT '',
      "address" TEXT NOT NULL DEFAULT '',
      "poDate" TIMESTAMP(3),
      "ewayBillNo" TEXT NOT NULL DEFAULT '',
      "poNo" TEXT NOT NULL DEFAULT '',
      "placeOfSupply" TEXT NOT NULL DEFAULT '',
      "shipToAddress" TEXT NOT NULL DEFAULT '',
      "transportName" TEXT NOT NULL DEFAULT '',
      "vehicleNumber" TEXT NOT NULL DEFAULT '',
      "taxType" TEXT NOT NULL DEFAULT 'cgst-sgst',
      "paymentMode" TEXT NOT NULL DEFAULT '',
      "notes" TEXT NOT NULL DEFAULT '',
      "terms" TEXT NOT NULL DEFAULT '',
      "bankDetails" TEXT NOT NULL DEFAULT '',
      "authorizedSignature" TEXT NOT NULL DEFAULT '',
      "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "discountTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "extraDiscountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "taxableAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "roundOff" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "grandTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "status" TEXT NOT NULL DEFAULT 'Active',
      CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "Quotation_invoiceNumber_key" UNIQUE ("invoiceNumber")
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "QuotationItem" (
      "id" TEXT NOT NULL,
      "quotationId" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "hsn" TEXT NOT NULL DEFAULT '',
      "unit" TEXT NOT NULL DEFAULT '',
      "qty" INTEGER NOT NULL DEFAULT 0,
      "rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "taxPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "discountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "taxablePerUnit" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "taxableAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "gstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "finalRatePerUnit" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "rowAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "QuotationItem_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "QuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Quotation" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'Active'
  `);

  console.log("Quotation tables created or already existed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
