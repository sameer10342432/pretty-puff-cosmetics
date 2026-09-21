import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

// If separate cPanel database variables are provided and DATABASE_URL is empty,
// construct standard MySQL connection URL safely:
if (!process.env.DATABASE_URL && process.env.DB_NAME) {
  const user = encodeURIComponent(process.env.DB_USER || '');
  const pass = encodeURIComponent(process.env.DB_PASSWORD || '');
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '3306';
  const dbName = process.env.DB_NAME;
  process.env.DATABASE_URL = `mysql://${user}:${pass}@${host}:${port}/${dbName}`;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;

