import type { PrismaClient } from '@prisma/client';

/**
 * Truncate every application table between tests so each test starts clean.
 * Truncate (not transaction-rollback) because services manage their own
 * transactions, which would conflict with an outer rollback wrapper.
 * `_prisma_migrations` is preserved so the applied schema stays intact.
 */
export async function resetDb(prisma: PrismaClient): Promise<void> {
  const rows = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `;
  if (rows.length === 0) return;
  const list = rows.map((r) => `"public"."${r.tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE;`,
  );
}
