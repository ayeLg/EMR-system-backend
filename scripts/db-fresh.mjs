import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const confirmed = args.has('--yes');

if (process.env.NODE_ENV === 'production' && !args.has('--allow-production')) {
  console.error('Refusing to reset a production database.');
  process.exit(1);
}

if (!confirmed) {
  const rl = createInterface({ input, output });
  const answer = await rl.question(
    'This will reset the local database. Type RESET to continue: ',
  );
  rl.close();

  if (answer !== 'RESET') {
    console.log('Cancelled.');
    process.exit(0);
  }
}

run('Reset database schema', 'pnpm', [
  'exec',
  'prisma',
  'migrate',
  'reset',
  '--force',
]);
run('Seed database', 'pnpm', ['db:seed']);
run('Check database readiness', 'pnpm', ['db:check']);

function run(label, command, commandArgs) {
  console.log(`\n> ${label}`);
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
