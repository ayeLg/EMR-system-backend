# EMR System Backend

NestJS backend for an EMR system with **JWT auth**, **CASL RBAC**,
**Prisma/PostgreSQL**, Swagger docs, and a unit/integration/e2e testing
foundation.

## Features

- Global JWT guard with `@Public()` opt-out
- CASL ability factory driven by `src/authorization/roles/role-permissions.ts`
- Route policies via `@CheckPolicies()` and `PoliciesGuard`
- Prisma-backed users with Laravel-style seeders in `prisma/seeds/`
- Feature generator: `scripts/generate-feature.sh`
- Testcontainers-backed integration and e2e tests

## Quick start

```bash
nvm use
cp .env.example .env
pnpm install
pnpm db:fresh
pnpm start:dev
```

This is a **pnpm-only** project. `npm install` is intentionally blocked by the
preinstall guard because npm cannot safely manage pnpm's lockfile and
`node_modules/.pnpm` layout.

For a full local bootstrap, use:

```bash
pnpm setup
```

API base: `http://localhost:${PORT}/api` (`PORT=3000` in `.env.example`)

**Swagger UI:** `http://localhost:${PORT}/api/docs`

1. Browser prompts for **HTTP Basic Auth** (`SWAGGER_USER` / `SWAGGER_PASSWORD` from `.env`)
2. Inside Swagger, **Authorize** with the JWT from `POST /api/auth/login`

Set `SWAGGER_ENABLED=false` to disable docs entirely in production.

### Demo login

The dev seeders create one bootstrap admin user:

```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"ChangeMe123!"}'
```

Use the returned `accessToken` as `Authorization: Bearer <token>` for protected routes.

| Email             | Password     | Role        |
| ----------------- | ------------ | ----------- |
| admin@example.com | ChangeMe123! | super_admin |

This password is **development only**. Change production/bootstrap credentials
before using a real environment.

## Add a new feature

```bash
pnpm generate:feature appointments Appointment appointment
```

Then follow [docs/ADDING_FEATURES.md](docs/ADDING_FEATURES.md).

## Scripts

| Command            | Description                                     |
| ------------------ | ----------------------------------------------- |
| `pnpm start:dev`   | Dev server with watch                           |
| `pnpm setup`       | One-command local setup                         |
| `pnpm verify`      | Generate Prisma client, typecheck, lint, unit   |
| `pnpm verify:full` | `verify` plus integration and e2e tests         |
| `pnpm build`       | Production build                                |
| `pnpm diagnose`    | Grouped static diagnostics for editor issues    |
| `pnpm test:unit`   | Unit tests                                      |
| `pnpm test:int`    | Integration tests with Testcontainers Postgres  |
| `pnpm test:e2e`    | E2E tests with Testcontainers Postgres          |
| `pnpm lint:check`  | ESLint without fixes                            |
| `pnpm db:status`   | Prisma migration status                         |
| `pnpm db:fresh`    | Reset local DB, seed, check                     |
| `pnpm api:openapi` | Export OpenAPI JSON to `generated/openapi.json` |

## Documentation

- **[AGENTS.md](AGENTS.md)** — conventions and agent workflow
- **[docs/developer-workflow.md](docs/developer-workflow.md)** — local dev workflow and DX commands
- **[docs/ADDING_FEATURES.md](docs/ADDING_FEATURES.md)** — feature checklist
- **[docs/testing-quickstart.md](docs/testing-quickstart.md)** — day-to-day testing commands
- **[docs/testing-conventions.md](docs/testing-conventions.md)** — testing rules and safety gates
- **`src/modules/patients/`** — reference feature module

## License

UNLICENSED (private project)
