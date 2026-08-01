import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { normalizeDatabaseUrl } from './dbUrl';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient | null };

function createPrismaClient(): PrismaClient | null {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    console.warn('[prisma] DATABASE_URL or DIRECT_URL is not configured; using a disabled client.');
    return null;
  }

  try {
    const normalizedConnectionString = normalizeDatabaseUrl(connectionString);
    const adapter = new PrismaPg({
      connectionString: normalizedConnectionString,
      ssl: { rejectUnauthorized: false },
    });

    return new PrismaClient({ adapter });
  } catch (error) {
    console.warn('[prisma] Unable to initialize Prisma client:', error);
    return null;
  }
}

function getPrismaClient(): PrismaClient | null {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const client = createPrismaClient();
  globalForPrisma.prisma = client;
  return client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    if (!client) {
      throw new Error('DATABASE_URL or DIRECT_URL is required');
    }
    return Reflect.get(client, prop);
  },
});
