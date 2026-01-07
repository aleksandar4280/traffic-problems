// Prisma Client - Singleton pattern za Next.js (Prisma 7)

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from 'pg';
const { Pool } = pkg;

const globalForPrisma = global;

// Kreiranje connection pool-a
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Kreiranje Prisma adaptera
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;