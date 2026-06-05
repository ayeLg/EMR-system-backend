/**
 * DatabaseSeeder — the Laravel-style orchestrator. Runs registered seeders in
 * order (the equivalent of `$this->call([...])`).
 *
 *   pnpm db:seed                     # run all seeders, in order
 *   pnpm db:seed --only=RolesSeeder  # run a single seeder (like --class=)
 *
 * Add new seeders with: pnpm make:seeder <Name>   (auto-registers below)
 * Keep each seeder idempotent (upsert) so re-running is safe.
 */
import { prisma } from './client';
import { Seeder } from './seeds/seeder';
// <seeder-imports> — do not remove this marker (used by make:seeder)
import { RolesSeeder } from './seeds/roles.seeder';
import { PermissionsSeeder } from './seeds/permissions.seeder';
import { RolePermissionsSeeder } from './seeds/role-permissions.seeder';
import { UsersSeeder } from './seeds/users.seeder';
// </seeder-imports>

// Order matters: list dependencies before dependents.
const seeders: Seeder[] = [
  RolesSeeder,
  PermissionsSeeder,
  RolePermissionsSeeder,
  UsersSeeder,
  // <seeder-registry> — do not remove this marker (used by make:seeder)
];

async function main(): Promise<void> {
  const onlyArg = process.argv.find((a) => a.startsWith('--only='));
  const only = onlyArg?.split('=')[1];

  const toRun = only ? seeders.filter((s) => s.name === only) : seeders;
  if (only && toRun.length === 0) {
    throw new Error(
      `No seeder named "${only}". Available: ${seeders.map((s) => s.name).join(', ')}`,
    );
  }

  for (const seeder of toRun) {
    const start = Date.now();
    console.log(`Seeding: ${seeder.name}`);
    await seeder.run(prisma);
    console.log(`Seeded:  ${seeder.name} (${Date.now() - start}ms)`);
  }
  console.log(`Done. ${toRun.length} seeder(s) run.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
