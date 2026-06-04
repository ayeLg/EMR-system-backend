const expectedPackageManager = 'pnpm';
const userAgent = process.env.npm_config_user_agent;

if (userAgent && !userAgent.startsWith(`${expectedPackageManager}/`)) {
  console.error(
    `This backend uses pnpm. Current package manager: ${userAgent}.`,
  );
  console.error('Run `corepack enable` if needed, then use `pnpm install`.');
  process.exit(1);
}

const minimumMajor = 24;
const current = process.versions.node;
const major = Number.parseInt(current.split('.')[0] ?? '0', 10);

if (major < minimumMajor) {
  console.error(
    `Node ${minimumMajor}+ is required for this backend. Current: ${current}.`,
  );
  console.error('Run `nvm use` from medical-project-backend, then retry.');
  process.exit(1);
}
