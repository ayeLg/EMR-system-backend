import { execSync } from 'node:child_process';
import { startPostgres } from './postgres-container';
import { applyTestEnv } from './test-env';

/**
 * Jest globalSetup: boot one Postgres container, publish its URI as
 * DATABASE_URL, then apply Prisma migrations. Runs once before the worker
 * (integration runs with maxWorkers: 1, so process.env propagates).
 */
export default async function globalSetup(): Promise<void> {
  applyTestEnv();
  const container = await startPostgres();
  const url = container.getConnectionUri();
  process.env.DATABASE_URL = url;

  // Apply the schema to the fresh container.
  execSync('pnpm exec prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: url },
  });
}
