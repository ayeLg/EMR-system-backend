import { stopPostgres } from './postgres-container';
import { disconnectTestPrisma } from './prisma-test-client';

/** Jest globalTeardown: disconnect Prisma and stop the container. */
export default async function globalTeardown(): Promise<void> {
  await disconnectTestPrisma();
  await stopPostgres();
}
