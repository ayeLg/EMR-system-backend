const minimumMajor = 22;
const current = process.versions.node;
const major = Number.parseInt(current.split('.')[0] ?? '0', 10);

if (major < minimumMajor) {
  console.error(
    `Node ${minimumMajor}+ is required for this backend. Current: ${current}.`,
  );
  console.error('Run `nvm use` from medical-project-backend, then retry.');
  process.exit(1);
}
