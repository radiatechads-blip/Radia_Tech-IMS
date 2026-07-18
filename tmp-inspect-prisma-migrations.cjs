const fs = require('fs');
const { execSync } = require('child_process');
const sql = 'SELECT id, checksum, finished_at, applied_steps_count, migration_name, logs FROM "_prisma_migrations" ORDER BY finished_at NULLS LAST, applied_steps_count DESC LIMIT 20;';
fs.writeFileSync('temp_prisma_migrations.sql', sql, 'utf8');
try {
  execSync('npx prisma db execute --file temp_prisma_migrations.sql', { stdio: 'inherit' });
} catch (error) {
  console.error('EXECUTE_FAILED', error.message);
  process.exit(1);
} finally {
  fs.rmSync('temp_prisma_migrations.sql', { force: true });
}
