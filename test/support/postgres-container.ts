import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';

/**
 * Boots an ephemeral Postgres 15 container (matching production's major
 * version) for integration tests. One instance per Jest run; the connection
 * URI is published via process.env.DATABASE_URL in global-setup.
 */
let container: StartedPostgreSqlContainer | undefined;

export async function startPostgres(): Promise<StartedPostgreSqlContainer> {
  container = await new PostgreSqlContainer('postgres:15')
    .withDatabase('emr_test')
    .withUsername('emr_test')
    .withPassword('emr_test')
    .start();
  return container;
}

export async function stopPostgres(): Promise<void> {
  if (container) {
    await container.stop();
    container = undefined;
  }
}
