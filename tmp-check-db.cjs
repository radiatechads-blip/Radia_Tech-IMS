require('dotenv/config');
const { Pool } = require('pg');
(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const tables = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND lower(table_name)='payment'"
    );
    console.log('payment table rows=', tables.rows);
    const migrations = await pool.query(
      'SELECT id, checksum, finished_at, applied_steps_count, migration_name, logs FROM "_prisma_migrations" ORDER BY finished_at NULLS LAST, applied_steps_count DESC LIMIT 20'
    );
    console.log('migrations rows=', migrations.rows);
  } catch (err) {
    console.error('ERROR', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
