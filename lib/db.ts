/**
 * Adversoft Database Connection Foundation
 * Prepares the Prisma ORM connection for PostgreSQL data cluster.
 */

let prismaInstance: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require('@prisma/client');
  const globalForPrisma = globalThis as unknown as { prisma: any };
  prismaInstance = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaInstance;
} catch {
  // Prisma client instance fallback
  prismaInstance = null;
}

export const db = prismaInstance;
export default db;
