import { PrismaClient } from '@prisma/client';

/**
 * Laravel-style seeder contract. Each seeder is a small class-like object with
 * a `name` (shown in logs / used by `db:seed --only=`) and an idempotent
 * `run()`. Register seeders in `prisma/seed.ts` (the DatabaseSeeder), which
 * calls them in order — the equivalent of Laravel's `$this->call([...])`.
 *
 * Keep every seeder idempotent (use `upsert`) so it is safe to re-run.
 */
export interface Seeder {
  name: string;
  run(prisma: PrismaClient): Promise<void>;
}
