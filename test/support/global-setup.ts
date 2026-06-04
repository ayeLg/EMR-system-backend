import { execSync } from 'node:child_process';
import { startPostgres } from './postgres-container';
import { applyTestEnv } from './test-env';

/**
 * Make Testcontainers find the container runtime without manual shell env.
 *
 * - DOCKER_HOST: derive from the active `docker context` if unset. This makes
 *   the harness portable across Docker Desktop, Colima, and others instead of
 *   relying on a default socket path.
 * - TESTCONTAINERS_RYUK_DISABLED: default to true. Ryuk (the reaper) bind-mounts
 *   the docker socket into a container, which VM-backed runtimes like Colima
 *   reject ("operation not supported"). globalTeardown stops our container
 *   explicitly, so the reaper is not required here. CI on real Docker can
 *   re-enable it by exporting TESTCONTAINERS_RYUK_DISABLED=false.
 */
function ensureContainerRuntime(): void {
  if (!process.env.DOCKER_HOST) {
    try {
      const host = execSync(
        'docker context inspect --format "{{.Endpoints.docker.Host}}"',
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
      ).trim();
      if (host) {
        process.env.DOCKER_HOST = host;
      }
    } catch {
      // No docker CLI / context — fall back to Testcontainers' own discovery.
    }
  }
  process.env.TESTCONTAINERS_RYUK_DISABLED ??= 'true';
}

/**
 * Jest globalSetup: boot one Postgres container, publish its URI as
 * DATABASE_URL, then apply Prisma migrations. Runs once before the worker
 * (integration runs with maxWorkers: 1, so process.env propagates).
 */
export default async function globalSetup(): Promise<void> {
  applyTestEnv();
  ensureContainerRuntime();
  const container = await startPostgres();
  const url = container.getConnectionUri();
  process.env.DATABASE_URL = url;

  // Apply the schema to the fresh container.
  execSync('pnpm exec prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: url },
  });
}
