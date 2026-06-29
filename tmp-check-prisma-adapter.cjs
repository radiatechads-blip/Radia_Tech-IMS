require('dotenv/config');
const { PrismaClient } = require('./src/generated/prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { normalizeDatabaseUrl } = require('./src/lib/dbUrl.ts');
const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString: normalizeDatabaseUrl(connectionString), ssl: { rejectUnauthorized: false } });
const prisma = new PrismaClient({ adapter });
console.log('serviceSpecialization exists', Boolean(prisma.serviceSpecialization));
prisma.$disconnect().catch(() => {});
