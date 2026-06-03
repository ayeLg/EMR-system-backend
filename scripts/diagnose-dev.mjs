import { spawnSync } from 'node:child_process';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));

const allTasks = [
  {
    key: 'types',
    title: 'TypeScript editor diagnostics',
    command: 'pnpm',
    args: [
      'exec',
      'tsc',
      '-p',
      'tsconfig.diagnostics.json',
      '--noEmit',
      '--pretty',
      'false',
    ],
    formatter: formatTypeScriptDiagnostics,
  },
  {
    key: 'lint',
    title: 'ESLint static analysis',
    command: 'pnpm',
    args: ['exec', 'eslint', '{src,apps,libs}/**/*.ts'],
    formatter: formatRawOutput,
  },
  {
    key: 'prisma',
    title: 'Prisma schema validation',
    command: 'pnpm',
    args: ['exec', 'prisma', 'validate'],
    formatter: formatRawOutput,
    minimumNodeMajor: 22,
  },
];

if (args.has('--help')) {
  printHelp();
  process.exit(0);
}

const selectedTasks = args.has('--types-only')
  ? allTasks.filter((task) => task.key === 'types')
  : allTasks.filter((task) => !args.has(`--skip-${task.key}`));

if (selectedTasks.length === 0) {
  console.error('No diagnostics selected.');
  process.exit(1);
}

printHeader();

let failed = false;
for (const task of selectedTasks) {
  const result = runTask(task);
  if (result.status !== 0) {
    failed = true;
  }
}

process.exit(failed ? 1 : 0);

function runTask(task) {
  console.log(`\n== ${task.title} ==`);
  if (task.minimumNodeMajor && getNodeMajor() < task.minimumNodeMajor) {
    console.log(
      `SKIPPED: requires Node >=${task.minimumNodeMajor}. Current Node is ${process.versions.node}.`,
    );
    return { status: 0 };
  }

  const result = spawnSync(task.command, task.args, {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  const output = cleanOutput([result.stdout, result.stderr].join('\n'));

  if (result.status === 0) {
    console.log('OK');
    if (output.trim()) {
      console.log(output.trim());
    }
    return result;
  }

  const formatted = task.formatter(output);
  console.log(formatted.trim() || 'Command failed without output.');
  return result;
}

function formatTypeScriptDiagnostics(output) {
  const diagnostics = [];
  const otherLines = [];
  const pattern = /^(.+?)\((\d+),(\d+)\): error TS(\d+): (.+)$/;

  for (const line of output.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    const match = trimmed.match(pattern);
    if (!match) {
      otherLines.push(trimmed);
      continue;
    }

    diagnostics.push({
      file: toRepoPath(match[1]),
      line: match[2],
      column: match[3],
      code: `TS${match[4]}`,
      message: match[5],
    });
  }

  if (diagnostics.length === 0) {
    return formatRawOutput(output);
  }

  const grouped = new Map();
  for (const diagnostic of diagnostics) {
    const group = grouped.get(diagnostic.file) ?? [];
    group.push(diagnostic);
    grouped.set(diagnostic.file, group);
  }

  const lines = [`Found ${diagnostics.length} TypeScript diagnostic(s):`];
  for (const [file, fileDiagnostics] of grouped.entries()) {
    lines.push(`\n${file}`);
    for (const diagnostic of fileDiagnostics) {
      lines.push(
        `  ${diagnostic.line}:${diagnostic.column}  ${diagnostic.code}  ${diagnostic.message}`,
      );
    }
  }

  if (otherLines.length > 0) {
    lines.push('\nOther output:');
    lines.push(...otherLines.map((line) => `  ${line}`));
  }

  return lines.join('\n');
}

function formatRawOutput(output) {
  return output.trim();
}

function cleanOutput(output) {
  return output
    .split('\n')
    .filter((line) => !line.includes('Unsupported engine'))
    .filter((line) => !line.includes('current: {"node"'))
    .join('\n');
}

function toRepoPath(path) {
  const absolutePath = resolve(root, path);
  return relative(root, absolutePath) || path;
}

function printHeader() {
  const current = process.versions.node;
  const major = getNodeMajor();
  console.log('Backend diagnostics');
  if (major < 22) {
    console.log(`Node warning: expected >=22, current ${current}`);
  } else {
    console.log(`Node: ${current}`);
  }
}

function getNodeMajor() {
  return Number.parseInt(process.versions.node.split('.')[0] ?? '0', 10);
}

function printHelp() {
  console.log(`Usage: pnpm diagnose [options]

Options:
  --types-only   Run only TypeScript editor diagnostics
  --skip-types   Skip TypeScript diagnostics
  --skip-lint    Skip ESLint static analysis
  --skip-prisma  Skip Prisma schema validation
`);
}
