require('dotenv/config');
const { Pool } = require('pg');
(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const tables = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND lower(table_name) IN ('payment', 'servicespecialization', 'invoice', 'invoiceitem') ORDER BY table_name"
    );
    console.log('tables:', tables.rows);
    const payment = await pool.query("SELECT count(*) as count FROM information_schema.tables WHERE table_schema='public' AND lower(table_name)='payment'");
    console.log('payment exists:', payment.rows[0]);
  } catch (err) {
    console.error('ERROR', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
