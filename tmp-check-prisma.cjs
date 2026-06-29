require('dotenv/config');
const { PrismaClient } = require('./src/generated/prisma/client');
console.log('PrismaClient type', typeof PrismaClient);
const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL || process.env.DIRECT_URL || 'postgresql://postgres:postgres@localhost:5432/postgres' });
console.log('has delegate', typeof prisma.serviceSpecialization);
prisma.$disconnect().catch(() => {});
