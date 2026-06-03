/**
 * DB connectivity / readiness check. Run with: pnpm db:check
 *
 * Confirms the database is reachable and reports server version, table count,
 * and applied migrations. Exits non-zero on failure — handy before db:migrate
 * / db:seed, in CI, or when debugging "Can't reach database server".
 */
import { prisma } from './client';

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL ?? '(DATABASE_URL not set)';
  // Mask the password before logging.
  console.log(`Target: ${url.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@')}`);

  const start = Date.now();
  // pg connects lazily, so $connect() alone can resolve even when the database
  // is missing. Use a real query as the connectivity probe so "Connected" is honest.
  await prisma.$queryRaw`SELECT 1`;
  console.log(`✓ Connected (${Date.now() - start}ms)`);

  const server = await prisma.$queryRaw<
    { version: string }[]
  >`SELECT version()`;
  console.log(`✓ Server: ${server[0]?.version.split(',')[0] ?? 'unknown'}`);

  const tables = await prisma.$queryRaw<{ count: number }[]>`
    SELECT COUNT(*)::int AS count
    FROM information_schema.tables
    WHERE table_schema = 'public'`;
  console.log(`✓ Public tables: ${tables[0]?.count ?? 0}`);

  try {
    const migrations = await prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::int AS count
      FROM _prisma_migrations
      WHERE finished_at IS NOT NULL`;
    console.log(`✓ Applied migrations: ${migrations[0]?.count ?? 0}`);
  } catch {
    console.log('… No _prisma_migrations table yet — run: pnpm db:migrate');
  }

  console.log('\nDatabase OK ✅');
}

main()
  .catch((e: unknown) => {
    const message = e instanceof Error ? e.message : String(e);
    console.error('\nDatabase check FAILED ❌');
    console.error(message);
    if (message.includes('does not exist') || message.includes('3D000')) {
      console.error(
        '\nHint: the database is missing. Create it then migrate:\n' +
          '  createdb <name>   (or run: pnpm db:migrate to create + build tables)',
      );
    }
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
