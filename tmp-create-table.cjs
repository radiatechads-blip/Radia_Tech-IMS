require('dotenv/config');
const { Client } = require('pg');

(async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS "public"."ServiceSpecialization" (
        "id" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "shortDescription" TEXT NOT NULL,
        "fullDescription" TEXT NOT NULL,
        "image" TEXT NOT NULL DEFAULT '',
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        PRIMARY KEY ("id")
      );
    `);
    console.log('ServiceSpecialization table created');
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
})();
