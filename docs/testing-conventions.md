# Testing Conventions

Three layers. Pick the lowest layer that can prove the behavior.

| Layer       | Files                                                   | DB                             | Use for                                                                 |
| ----------- | ------------------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------- |
| Unit        | `*.spec.ts` (next to source)                            | none (mock Prisma)             | pure logic: calculations, status-machine guards, CASL, validation rules |
| Integration | `*.int-spec.ts` (`test/integration/` or next to source) | real Postgres (Testcontainers) | Prisma queries, DB constraints, transactions, optimistic locking        |
| E2E         | `*.e2e-spec.ts` (`test/`)                               | real Postgres                  | full HTTP request through guards + pipes + interceptors                 |

## Commands

- `pnpm test:unit` — fast, no Docker.
- `pnpm test:int` — needs a container runtime running.
- `pnpm test:e2e` — needs a container runtime running.
- `pnpm test` — all three.
- `pnpm test:cov` — unit coverage with thresholds.

## Container runtime

Integration and e2e tests spin up a real `postgres:15` container via Testcontainers,
so a Docker-compatible runtime must be running. Colima (open-source) works:
`brew install colima docker && colima start`. `global-setup.ts` auto-discovers the
Docker host from the active `docker context` and disables the Ryuk reaper (it cannot
bind-mount the socket on VM-backed runtimes like Colima); the container is stopped in
`global-teardown.ts`. CI on real Docker may re-enable Ryuk with
`TESTCONTAINERS_RYUK_DISABLED=false`.

## Rules

- **AAA**: Arrange, Act, Assert — one behavior per test.
- `it()` names read as specifications: "throws when the patient has an active drug allergy".
- **No real network, time, or randomness.** Seed faker (`faker.seed(n)`); freeze the clock for time-dependent code.
- Integration/e2e tests start from a truncated DB (`resetDb`) in `beforeEach`.
- Build data with factories in `test/support/factories/`, never inline literals for full entities.

## Safety-critical test checklist

Every patient-safety rule (allergy block, drug-interaction block, critical-lab protocol,
dosage/billing math) MUST have all four:

1. **Happy path** — the normal allowed case.
2. **Block/deny path** — the dangerous case is actually blocked.
3. **Edge case** — boundary values (e.g. a value exactly on a reference-range limit; an
   allergen that matches by class, not exact name).
4. **Override-with-audit path** — when an override is allowed, it requires a reason and
   writes an audit entry.

Safety-critical modules (`src/modules/clinical|pharmacy|laboratory|billing`) are held to
95%+ coverage by `jest.config.ts`. Adding an untested `.ts` file to any of these dirs
fails `pnpm test:cov`. Each dir currently ships a placeholder `index.ts` + `index.spec.ts`
(Jest 30 errors on a coverage glob that matches no files); delete the placeholder when
you implement the real module.
