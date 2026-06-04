#!/usr/bin/env node
// Laravel-style `make:seeder`. Scaffolds prisma/seeds/<kebab>.seeder.ts and
// auto-registers it in prisma/seed.ts (the DatabaseSeeder).
//
//   pnpm make:seeder Departments
//   pnpm make:seeder drug-inventory
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const seedFile = join(root, 'prisma', 'seed.ts');
const seedsDir = join(root, 'prisma', 'seeds');

const raw = process.argv[2];
if (!raw) {
  console.error(
    'Usage: pnpm make:seeder <Name>   e.g. pnpm make:seeder Departments',
  );
  process.exit(1);
}

// Normalise the name into words, dropping any trailing "seeder".
const words = raw
  .replace(/[_\s]+/g, '-')
  .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
  .toLowerCase()
  .split('-')
  .filter(Boolean)
  .filter((w, i, a) => !(i === a.length - 1 && w === 'seeder'));

if (words.length === 0) {
  console.error('Invalid seeder name.');
  process.exit(1);
}

const pascal = words.map((w) => w[0].toUpperCase() + w.slice(1)).join('');
const exportName = `${pascal}Seeder`;
const fileBase = `${words.join('-')}.seeder`;
const filePath = join(seedsDir, `${fileBase}.ts`);

if (existsSync(filePath)) {
  console.error(`Seeder already exists: prisma/seeds/${fileBase}.ts`);
  process.exit(1);
}

const template = `import { Seeder } from './seeder';

export const ${exportName}: Seeder = {
  name: '${exportName}',
  async run(prisma) {
    // TODO: seed data here. Keep it idempotent (use upsert).
    // await prisma.model.upsert({ where: { ... }, update: {}, create: { ... } });
  },
};
`;

mkdirSync(seedsDir, { recursive: true });
writeFileSync(filePath, template);

// Auto-register in prisma/seed.ts via the marker comments.
let seed = readFileSync(seedFile, 'utf8');
const importMarker = '// </seeder-imports>';
const registryMarker = '// <seeder-registry>';

if (seed.includes(exportName)) {
  console.log(`Created prisma/seeds/${fileBase}.ts (already registered).`);
} else if (seed.includes(importMarker) && seed.includes(registryMarker)) {
  seed = seed.replace(
    importMarker,
    `import { ${exportName} } from './seeds/${fileBase}';\n${importMarker}`,
  );
  seed = seed.replace(registryMarker, `${exportName},\n  ${registryMarker}`);
  writeFileSync(seedFile, seed);
  console.log(
    `Created prisma/seeds/${fileBase}.ts and registered ${exportName} in prisma/seed.ts`,
  );
} else {
  console.log(`Created prisma/seeds/${fileBase}.ts`);
  console.warn('Could not find markers in prisma/seed.ts — register manually:');
  console.warn(`  import { ${exportName} } from './seeds/${fileBase}';`);
  console.warn(`  add ${exportName} to the seeders array`);
}
