import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));

if (args.has('--help')) {
  printHelp();
  process.exit(0);
}

checkNodeVersion();
ensureEnvFile();

if (!args.has('--skip-install')) {
  run('Install dependencies', 'pnpm', ['install']);
}

if (!args.has('--skip-docker')) {
  run('Start local services', 'pnpm', ['docker:up']);
}

if (!args.has('--skip-db')) {
  run('Generate Prisma client', 'pnpm', ['db:generate']);
  run('Apply database migrations', 'pnpm', ['db:migrate']);

  if (!args.has('--skip-seed')) {
    run('Seed database', 'pnpm', ['db:seed']);
  }

  run('Check database readiness', 'pnpm', ['db:check']);
}

console.log('\nDev setup complete. Start the API with: pnpm start:dev');

function checkNodeVersion() {
  const minimumMajor = 22;
  const current = process.versions.node;
  const major = Number.parseInt(current.split('.')[0] ?? '0', 10);

  if (major < minimumMajor) {
    console.error(
      `Node ${minimumMajor}+ is required for setup. Current: ${current}.`,
    );
    console.error('Run `nvm use` from medical-project-backend, then retry.');
    process.exit(1);
  }
}

function ensureEnvFile() {
  const envPath = resolve(root, '.env');
  const examplePath = resolve(root, '.env.example');

  if (existsSync(envPath)) {
    console.log('Using existing .env');
    return;
  }

  copyFileSync(examplePath, envPath);
  console.log('Created .env from .env.example');
  console.log('Review secrets such as JWT_SECRET and PHI_ENCRYPTION_KEY.');
}

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

function printHelp() {
  console.log(`Usage: pnpm setup [options]

Options:
  --skip-install  Do not run pnpm install
  --skip-docker   Do not start docker-compose services
  --skip-db       Do not generate, migrate, seed, or check the database
  --skip-seed     Run database setup without seeders
`);
}
