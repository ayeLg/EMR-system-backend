# EMR System Backend (NestJS Starter)

NestJS starter kit with **JWT auth** and **RBAC using CASL**. Includes an example `patients` feature, a feature scaffold template, and [AGENTS.md](AGENTS.md) for AI-assisted development.

## Features

- Global JWT guard with `@Public()` opt-out
- CASL ability factory driven by `src/roles/role-permissions.ts`
- Route policies via `@CheckPolicies()` and `PoliciesGuard`
- Feature generator: `scripts/generate-feature.sh`
- In-memory demo users and patients (swap for a database when ready)

## Quick start

```bash
cp .env.example .env
pnpm install
pnpm run start:dev
```

For a full local bootstrap, use:

```bash
pnpm setup
```

API base: `http://localhost:3000/api`

**Swagger UI:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

1. Browser prompts for **HTTP Basic Auth** (`SWAGGER_USER` / `SWAGGER_PASSWORD` from `.env`)
2. Inside Swagger, **Authorize** with the JWT from `POST /api/auth/login`

Set `SWAGGER_ENABLED=false` to disable docs entirely in production.

### Demo login

```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"doctor@example.com","password":"password123"}'
```

Use the returned `accessToken` as `Authorization: Bearer <token>` for protected routes.

| Email                 | Role         |
| --------------------- | ------------ |
| admin@example.com     | super_admin  |
| doctor@example.com    | doctor       |
| nurse@example.com     | nurse        |
| reception@example.com | receptionist |

Password for all demo users: `password123`

## Add a new feature

```bash
chmod +x scripts/generate-feature.sh
./scripts/generate-feature.sh appointments Appointment appointment
```

Then follow [docs/ADDING_FEATURES.md](docs/ADDING_FEATURES.md).

## Scripts

| Command              | Description                                     |
| -------------------- | ----------------------------------------------- |
| `pnpm run start:dev` | Dev server with watch                           |
| `pnpm setup`         | One-command local setup                         |
| `pnpm run build`     | Production build                                |
| `pnpm run test`      | Unit tests                                      |
| `pnpm run test:e2e`  | E2E tests                                       |
| `pnpm run lint`      | ESLint                                          |
| `pnpm db:status`     | Prisma migration status                         |
| `pnpm db:fresh`      | Reset local DB, seed, check                     |
| `pnpm api:openapi`   | Export OpenAPI JSON to `generated/openapi.json` |

## Documentation

- **[AGENTS.md](AGENTS.md)** — conventions and agent workflow
- **[docs/developer-workflow.md](docs/developer-workflow.md)** — local dev workflow and DX commands
- **[docs/ADDING_FEATURES.md](docs/ADDING_FEATURES.md)** — feature checklist
- **`src/patients/`** — reference feature module

## License

UNLICENSED (private project)
