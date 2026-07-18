require('dotenv/config');
const { Pool } = require('pg');
(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const schema = await pool.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='_prisma_migrations' ORDER BY ordinal_position"
    );
    console.log('columns:', schema.rows);
    const row = await pool.query(
      "SELECT * FROM \"_prisma_migrations\" WHERE migration_name='20260629120000_add_service_specializations'"
    );
    console.log('migration row:', row.rows);
  } catch (err) {
    console.error('ERROR', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
