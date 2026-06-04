import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

/**
 * Standalone PrismaClient for integration tests, pointed at the Testcontainers
 * database via DATABASE_URL (set by global-setup). Decoupled from Nest DI so
 * DB-level tests don't need the full app to boot.
 */
let prisma: PrismaClient | undefined;

export function getTestPrisma(): PrismaClient {
  if (!prisma) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        'DATABASE_URL not set — is global-setup wired into the jest config?',
      );
    }
    prisma = new PrismaClient({ adapter: new PrismaPg(url) });
  }
  return prisma;
}

export async function disconnectTestPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = undefined;
  }
}
