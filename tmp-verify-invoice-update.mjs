import 'dotenv/config';
import { PrismaClient } from './src/generated/prisma/client/index.js';

const prisma = new PrismaClient();

try {
  const existing = await prisma.invoice.findFirst({
    select: { id: true, invoiceNumber: true, extraDiscountAmount: true },
  });

  if (!existing) {
    console.log('No invoices found to verify');
    process.exit(0);
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
} finally {
  await prisma.$disconnect();
}
