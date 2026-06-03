import { config as loadEnv } from 'dotenv';
import { expand } from 'dotenv-expand';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaClient for standalone CLI scripts (seed, db:check). Prisma 7 no longer
 * auto-loads .env, so load + expand it here, then connect via the pg adapter.
 * The Nest app uses PrismaService instead (DI + config).
 */
expand(loadEnv());

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL is not set (check .env / DB_* parts)');
}

export const prisma = new PrismaClient({ adapter: new PrismaPg(url) });
