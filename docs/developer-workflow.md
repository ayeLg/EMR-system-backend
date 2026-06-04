# Developer Workflow

This page is for day-to-day backend development. It focuses on setup, local
database work, code generation, and API contract export.

## Runtime

Use Node 24 for local development:

```bash
nvm use
```

The project also has `.node-version` for tools such as fnm, mise, and asdf.
`pnpm install` runs `scripts/check-node-version.mjs` and fails fast on Node
versions below 24.

## Package manager

Use pnpm only:

```bash
pnpm install
```

`npm install` is intentionally blocked by the preinstall guard. The repo is
locked by `pnpm-lock.yaml`, and npm can crash or produce a conflicting install
tree when pointed at pnpm's `node_modules/.pnpm` layout.

## One-command setup

```bash
pnpm setup
```

The setup command:

1. checks the Node version
2. creates `.env` from `.env.example` if needed
3. installs dependencies
4. starts local Docker services
5. generates Prisma client code
6. applies migrations
7. runs seeders
8. checks database readiness

Useful variants:

```bash
pnpm setup --skip-install
pnpm setup --skip-docker
pnpm setup --skip-db
pnpm setup --skip-seed
```

## Database commands

```bash
pnpm db:status       # Prisma migration status
pnpm db:check        # connectivity, server version, table count, migrations
pnpm db:seed:roles   # run only RolesSeeder
pnpm db:seed:users   # run only UsersSeeder
pnpm db:fresh        # reset local schema, seed, then check
pnpm db:fresh --yes  # same, without confirmation prompt
```

`db:fresh` refuses to run when `NODE_ENV=production` unless explicitly passed
`--allow-production`.

## Seed data

Seeders live in `prisma/seeds/` and are registered in `prisma/seed.ts`.

- `RolesSeeder` creates RBAC roles.
- `UsersSeeder` creates the development bootstrap admin:
  `admin@example.com` / `ChangeMe123!`.
- Seeders must stay idempotent by using `upsert`, so re-running
  `pnpm db:seed` is safe.

The bootstrap password is development-only. Use environment-specific secrets or
an explicit credential rotation step before real deployments.

## API contract export

Export the Swagger/OpenAPI document used by the running API docs:

```bash
pnpm api:openapi
pnpm api:openapi --output=generated/emr-openapi.json
```

The default output is `generated/openapi.json`, which is gitignored. Frontend
tooling can consume this file to generate client types.

## Observability toggles

Development request logging is enabled by default outside production. Override
it in `.env`:

```bash
REQUEST_LOGGING_ENABLED=false
```

Prisma query logging is off by default. Enable only when debugging query shape
or performance:

```bash
PRISMA_QUERY_LOGGING=true
```

Every HTTP response receives an `x-request-id` header. Passing an incoming
`x-request-id` preserves it, which makes frontend/backend debugging easier.

## Diagnostics

Use diagnostics when the editor shows TypeScript or static-analysis problems
that are not obvious build failures:

```bash
pnpm diagnose
pnpm diagnose --types-only
pnpm diagnose:types
```

`pnpm diagnose` reports TypeScript editor diagnostics, ESLint findings, and
Prisma schema validation in grouped sections. `pnpm diagnose:types` runs the
strict TypeScript diagnostics config directly. It enables
`strictPropertyInitialization`, so it catches entity-class issues such as:

```text
src/modules/patients/entities/patient.entity.ts
  2:3  TS2564  Property 'id' has no initializer...
```

## Feature generation

```bash
pnpm generate:feature appointments Appointment appointment
```

Arguments:

- `appointments`: route and folder name
- `Appointment`: class/module name
- `appointment`: Prisma delegate name, usually the lower-camel model name

Generated services use `PrismaService`, Zod DTOs, pagination defaults, CASL
policy helpers, and a placeholder `buildSearchWhere()` method. After
generation, replace placeholder DTO fields and search logic with model-specific
fields.

## Local verification

Before opening a PR, run:

```bash
pnpm verify
```

For the full local gate, including Testcontainers-backed database tests:

```bash
pnpm verify:full
```

CI runs the same core checks on pushes to `main` and on pull requests:
Prisma generation, TypeScript, ESLint, unit tests, integration tests, and e2e
tests.
