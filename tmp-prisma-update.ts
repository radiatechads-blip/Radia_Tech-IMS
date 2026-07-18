import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import { PrismaClient } from './src/generated/prisma/client';
import { normalizeDatabaseUrl } from './src/lib/dbUrl';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const adapter = new PrismaPg({
  connectionString: normalizeDatabaseUrl(connectionString),
  ssl: { rejectUnauthorized: false },
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.invoice.findFirst({
    select: { id: true, invoiceNumber: true, extraDiscountAmount: true },
  });

  if (!existing) {
    console.log('No invoices found to verify');
    return;
  }

  const originalValue = Number(existing.extraDiscountAmount || 0);
  const testValue = originalValue + 12.34;

  const updated = await prisma.invoice.update({
    where: { id: existing.id },
    data: { extraDiscountAmount: testValue },
    select: { id: true, invoiceNumber: true, extraDiscountAmount: true },
  });

  console.log(JSON.stringify({ existing, updated }, null, 2));

  await prisma.invoice.update({
    where: { id: existing.id },
    data: { extraDiscountAmount: originalValue },
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
