require('dotenv').config();
const { PrismaClient } = require('./src/generated/prisma');

async function main() {
  const prisma = new PrismaClient();
  try {
    const invoice = await prisma.invoice.findFirst({
      select: { id: true, invoiceNumber: true, extraDiscountAmount: true },
    });
    console.log(JSON.stringify(invoice));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
