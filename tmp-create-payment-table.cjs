require('dotenv/config');
const { Pool } = require('pg');
(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const createTableSql = `CREATE TABLE IF NOT EXISTS "Payment" (
      "id" TEXT PRIMARY KEY,
      "invoiceId" TEXT NOT NULL,
      "amount" DOUBLE PRECISION NOT NULL,
      "paymentMode" TEXT NOT NULL DEFAULT 'Cash',
      "note" TEXT NOT NULL DEFAULT '',
      "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE
    );`;
    await pool.query(createTableSql);
    console.log('Payment table created or already exists.');
  } catch (err) {
    console.error('ERROR', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
