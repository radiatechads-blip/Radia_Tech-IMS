import 'dotenv/config';
import { Client } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  const statements = [
    'ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "extraDiscountAmount" DOUBLE PRECISION DEFAULT 0',
    'ALTER TABLE "ProformaInvoice" ADD COLUMN IF NOT EXISTS "extraDiscountAmount" DOUBLE PRECISION DEFAULT 0',
    'ALTER TABLE "Annexure" ADD COLUMN IF NOT EXISTS "extraDiscountAmount" DOUBLE PRECISION DEFAULT 0',
  ];

  for (const stmt of statements) {
    await client.query(stmt);
    console.log('Applied:', stmt);
  }

  console.log('extraDiscountAmount columns ensured');
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await client.end();
}
