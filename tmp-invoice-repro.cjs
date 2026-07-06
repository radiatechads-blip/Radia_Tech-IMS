const { PrismaClient } = require('./src/generated/prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { normalizeDatabaseUrl } = require('./src/lib/dbUrl.ts');

const connectionString = process.env.DATABASE_URL;
const normalized = normalizeDatabaseUrl(connectionString);
const adapter = new PrismaPg({ connectionString: normalized, ssl: { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter });

(async () => {
  try {
    await prisma.$connect();
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: 'TEST-POST-2',
        invoiceDate: new Date('2026-07-05'),
        partyName: 'Test Party',
        subtotal: 100,
        discountTotal: 0,
        taxableAmount: 100,
        taxAmount: 18,
        grandTotal: 118,
        items: { create: [] },
      },
    });
    console.log('created', invoice.id);
  } catch (error) {
    console.error('PRISMA_ERROR');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
})();
