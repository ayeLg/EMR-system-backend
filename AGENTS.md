# AGENTS.md — EMR NestJS Starter

Guidance for AI agents and developers working on this repository.

## Project purpose

NestJS **starter kit** for an EMR-style backend with:

- **JWT authentication** (Passport + `@nestjs/jwt`)
- **RBAC via CASL** (`@casl/ability`) — roles map to abilities; routes enforce policies
- **Feature module template** under `templates/feature/` and `scripts/generate-feature.sh`
- **In-memory demo data** (users, patients) — replace with a real database before production

## Tech stack

| Layer | Choice |
|-------|--------|
| Runtime | Node.js ≥ 22 (pinned in `.nvmrc` / `engines`) |
| Framework | NestJS 11 |
| ORM / DB | Prisma 7 + PostgreSQL 15 via pg driver adapter (`@prisma/adapter-pg`); schema `prisma/schema.prisma`, connection in `prisma.config.ts` |
| Auth | JWT Bearer tokens |
| Authorization | CASL + global `PoliciesGuard` |
| Validation | **Zod via `nestjs-zod`** (`createZodDto` + global `ZodValidationPipe`); shared schemas with frontend |
| Security | `helmet`, `compression`, `@nestjs/throttler` (rate limit), AES-256-GCM PHI encryption (`CryptoService`), TOTP 2FA (`TotpService`) |
| API docs | `@nestjs/swagger` at `/api/docs` (Zod schemas via `cleanupOpenApiDoc`) |
| Package manager | pnpm |
| Path alias | `@/*` → `src/*` |

## Repository layout

```
src/
  app.module.ts          # Root module, global guards
  main.ts                # Bootstrap, global prefix `api`, ValidationPipe
  auth/                  # Login, JWT strategy
  casl/                  # Ability factory, types, CASL module
  common/                # Guards, decorators, metadata keys
  config/                # Env config + validation
  health/                # Public health check
  patients/              # Example feature (reference implementation)
  roles/                 # Role enum + permission matrix
  users/                 # User entity + in-memory store
templates/feature/       # Scaffold for new modules
docs/ADDING_FEATURES.md  # Feature checklist
scripts/generate-feature.sh
```

## Commands

```bash
nvm use                 # Node 22 (see .nvmrc)
pnpm install
cp .env.example .env     # then set secrets (see below)

pnpm run docker:up       # local Postgres + Redis (docker-compose.dev.yml)
pnpm run db:generate     # generate Prisma client
pnpm run db:migrate      # create/apply dev migration
pnpm run db:seed         # seed data (prisma/seed.ts)

pnpm run start:dev       # http://localhost:3000/api
pnpm run build
pnpm run typecheck       # tsc --noEmit
pnpm run lint            # eslint --fix   (lint:check for CI, no --fix)
pnpm run test
pnpm run test:e2e        # requires docker:up (DB connection)
./scripts/generate-feature.sh <kebab> <Pascal>   # e.g. appointments Appointment
```

Copy `.env.example` to `.env`. Required secrets: `DATABASE_URL`, `JWT_SECRET`,
`JWT_REFRESH_SECRET` (≥16 chars), and `PHI_ENCRYPTION_KEY` (`openssl rand -hex 32`).
A pre-commit hook (husky) runs `lint-staged`; commit messages must follow
Conventional Commits (commitlint).

## Demo accounts

All passwords: `password123`

| Email | Role |
|-------|------|
| admin@example.com | super_admin |
| doctor@example.com | doctor |
| nurse@example.com | nurse |
| reception@example.com | receptionist |

## API overview

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/health` | Public | Liveness |
| POST | `/api/auth/login` | Public | Returns `accessToken` + `user` |
| GET | `/api/auth/me` | JWT | Current user |
| CRUD | `/api/patients` | JWT + CASL | Example feature |

Send JWT as: `Authorization: Bearer <token>`

**Swagger UI:** `http://localhost:3000/api/docs`

- **Layer 1:** HTTP Basic Auth (`SWAGGER_USER` / `SWAGGER_PASSWORD`) — protects the docs page itself
- **Layer 2:** JWT via **Authorize** — required to call protected API endpoints from Swagger

Disable docs with `SWAGGER_ENABLED=false` in production if not needed.

When adding endpoints, decorate controllers with `@ApiTags`, `@ApiOperation`, `@ApiBearerAuth(SWAGGER_BEARER_AUTH)` (protected routes), and response DTOs with `@ApiProperty`. Request DTOs can rely on the Swagger CLI plugin in `nest-cli.json` or explicit `@ApiProperty`.

## Authorization model (CASL)

### Flow

1. `JwtAuthGuard` (global) validates token unless `@Public()`
2. `JwtStrategy` loads user onto `request.user`
3. `PoliciesGuard` (global) runs handlers from `@CheckPolicies(...)` on the route
4. `CaslAbilityFactory.createForUser(user)` builds abilities from `ROLE_PERMISSIONS`

### Key files

- `src/casl/casl-ability.factory.ts` — builds `AppAbility` per user
- `src/roles/role-permissions.ts` — **single source of truth** for role → action rules
- `src/casl/types/subjects.ts` — register every entity class CASL should know
- `src/<feature>/policies/*.policies.ts` — route-level policy callbacks

### Actions

`manage`, `create`, `read`, `update`, `delete` — see `src/casl/types/action.enum.ts`

`Action.Manage` on a subject implies all actions.

### Adding permissions for a new entity

1. Create entity class (e.g. `Appointment`)
2. Add to `AppSubjects` in `src/casl/types/subjects.ts`
3. Add rules in `src/roles/role-permissions.ts` for each `Role`
4. Create policy helpers in `src/<feature>/policies/`
5. Decorate controller methods with `@CheckPolicies(...)`

### Instance-level access

When rules need ownership (e.g. doctor updates only assigned patients):

```typescript
// role-permissions.ts
{ action: Action.Update, subject: Patient, conditions: { assignedDoctorId: '{{userId}}' } }
```

At runtime, pass the **entity instance** to `ability.can(Action.Update, patient)` in services when filtering lists or validating updates.

## Adding a new feature (agent workflow)

Follow this order every time:

1. Run `./scripts/generate-feature.sh <kebab> <Pascal>` or copy `templates/feature/`
2. Register `<Pascal>Module` in `src/app.module.ts`
3. Register entity in `src/casl/types/subjects.ts`
4. Add entries to `src/roles/role-permissions.ts`
5. Implement service persistence (repository/ORM) — **do not** leave in-memory stores in production paths unless explicitly requested
6. Ensure every controller route has `@CheckPolicies()` or `@Public()`
7. Add unit tests for service and CASL rules
8. Update this file or `docs/ADDING_FEATURES.md` only if conventions change

Detailed checklist: [docs/ADDING_FEATURES.md](docs/ADDING_FEATURES.md)

Reference module: **`src/patients/`**

## Coding conventions

- Use `@/` path alias for cross-module imports
- DTOs: define a Zod schema, then `export class XDto extends createZodDto(Schema) {}`. The global `ZodValidationPipe` validates request bodies/queries/params. Export the schema too so the frontend can share it. Do **not** add `class-validator` decorators to new DTOs.
- Persist via `PrismaService` (injectable, global `PrismaModule`) — not in-memory `Map`s
- Encrypt PHI fields (`first_name`, `last_name`, `nrc_number`, `address`) with `CryptoService` before DB write; decrypt on read
- Never bypass CASL with ad-hoc `if (user.role === ...)` in controllers — extend `role-permissions.ts` instead
- Use `@CurrentUser()` to access the authenticated user
- Use `@Public()` only for truly anonymous endpoints
- Keep modules focused: one domain per folder under `src/`
- Prefer explicit policy functions (`readPatientPolicy()`) over inline lambdas in controllers

## What not to do

- Do not commit `.env` or real secrets
- Do not disable global guards without documenting why
- Do not add features without CASL policies on protected routes
- Do not change `JWT_SECRET` default in committed code — use env vars

## Testing expectations

- `src/casl/casl-ability.factory.spec.ts` — role/ability matrix regressions
- Feature services — CRUD and not-found paths
- E2E — `test/app.e2e-spec.ts` for health + auth smoke tests

When changing `role-permissions.ts`, update CASL unit tests.

## Database (Prisma 7)

Prisma 7 + PostgreSQL via the **pg driver adapter**. `prisma/schema.prisma`
holds the models (copied from the project-root `schema.prisma`; the datasource
block has **no `url`** in v7 — keep models in sync with root). Connection wiring:

- **`.env`** — `DATABASE_URL` is composed from `DB_*` parts via `${...}` expansion.
- **`prisma.config.ts`** — loads + expands `.env`, gives Migrate/CLI the `datasource.url` and the `migrations.seed` command.
- **App runtime** — `PrismaService` (global `PrismaModule`) builds `new PrismaPg(config.database.url)` and passes it as `adapter` to `PrismaClient`; `ConfigModule` has `expandVariables: true`.
- **CLI scripts** (`prisma/seed.ts`, `prisma/db-check.ts`) — import the shared client `prisma/client.ts`, which loads+expands `.env` and connects via the adapter.

The `users` and `patients` services still use in-memory `Map`s as reference
demos. When implementing real features:

1. Inject `PrismaService` and replace the `Map` with Prisma queries
2. Run `pnpm db:migrate` after schema changes; add seeders (see below)
3. Keep `User` fields aligned with the JWT payload (`sub`, `email`, `role`)
4. Encrypt PHI with `CryptoService` before writing

### Migrations (Laravel-style)

Prisma migrations are timestamped folders under `prisma/migrations/`, like
Laravel. The schema is the source of truth — edit `prisma/schema.prisma`, then:

```bash
pnpm make:migration <name>   # prisma migrate dev --create-only — generates SQL, NOT applied (review it)
pnpm db:migrate              # apply pending migrations (dev)        ~ php artisan migrate
pnpm db:deploy               # apply in production (no prompts)
pnpm db:reset                # drop, re-migrate, re-seed             ~ php artisan migrate:fresh --seed
```

`make:migration` and `migrate` need the database up (`pnpm docker:up`).

### Seeding (Laravel-style)

Seeders live in `prisma/seeds/` — one file per seeder, each exporting a
`Seeder` object (`{ name, run(prisma) }`). `prisma/seed.ts` is the
**DatabaseSeeder**: it lists seeders in dependency order (like Laravel's
`$this->call([...])`) and runs them.

```bash
pnpm make:seeder <Name>          # scaffold prisma/seeds/<name>.seeder.ts + auto-register
pnpm db:seed                     # run all seeders, in order          ~ php artisan db:seed
pnpm db:seed --only=RolesSeeder  # run one seeder                     ~ --class=RolesSeeder
```

Rules: keep each seeder **idempotent** (use `upsert`); order dependencies
before dependents in the `seeders` array; do not remove the
`<seeder-imports>` / `<seeder-registry>` marker comments in `prisma/seed.ts`
(the generator uses them to auto-register).

### Checking the connection

```bash
pnpm db:check   # verifies DB is reachable; prints server version, table & migration counts; exits 1 on failure
```

Use it before `db:migrate` / `db:seed`, in CI, or to debug "Can't reach
database server" errors. The password in `DATABASE_URL` is masked in output.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Cannot find module '@/...'` | Ensure `tsconfig.json` paths; run `pnpm run build` |
| `Can't reach database server` | `pnpm docker:up`, then `pnpm db:check` to confirm |
| 403 on routes | Check `role-permissions.ts` and `@CheckPolicies` handlers |
| 401 everywhere | Missing/invalid JWT; login via `/api/auth/login` |
| Password hashing | Uses `bcryptjs` (pure JS, no native build) |

## Related docs

- [docs/ADDING_FEATURES.md](docs/ADDING_FEATURES.md)
- [templates/feature/README.md](templates/feature/README.md)
- [NestJS docs](https://docs.nestjs.com)
- [CASL docs](https://casl.js.org/v6/en/)
