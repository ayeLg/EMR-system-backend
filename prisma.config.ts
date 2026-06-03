import { config as loadEnv } from 'dotenv';
import { expand } from 'dotenv-expand';
import { defineConfig } from 'prisma/config';

// Load .env and expand ${...} references so DATABASE_URL is composed from the
// individual DB_* parts (Prisma 7 no longer auto-loads .env).
expand(loadEnv());

export default defineConfig({
  schema: 'prisma/schema.prisma',
  // Connection used by Prisma Migrate / introspection (CLI only).
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    seed: 'ts-node --project tsconfig.seed.json prisma/seed.ts',
  },
});
