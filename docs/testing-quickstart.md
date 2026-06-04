# Testing — Quick Start

> A 5-minute guide to running and writing tests on this backend.
> For the full rules and the safety-critical checklist, see [testing-conventions.md](./testing-conventions.md).

---

## 1. One-time setup

Tests come in 3 kinds. **Unit tests need nothing.** Integration and e2e tests start a
real Postgres in a container, so you need a container runtime once:

```bash
# Install Colima (open-source Docker runtime) — only once
brew install colima docker

# Start it (run again after each reboot)
colima start
```

Check it's running:

```bash
docker info > /dev/null 2>&1 && echo "ready" || echo "run: colima start"
```

> No Colima? `pnpm test:unit` still works. Only `test:int` / `test:e2e` need it.

---

## 2. Daily commands

| Command                | What it runs                                      | Needs Colima? | Speed                     |
| ---------------------- | ------------------------------------------------- | ------------- | ------------------------- |
| `pnpm test:unit`       | Pure logic, no DB                                 | No            | Fast                      |
| `pnpm test:int`        | Real Postgres (Prisma, constraints, transactions) | Yes           | First run slow, then fast |
| `pnpm test:e2e`        | Full app over HTTP                                | Yes           | Medium                    |
| `pnpm test`            | All three                                         | Yes           | —                         |
| `pnpm test:cov`        | Unit + coverage report                            | No            | Fast                      |
| `pnpm test:unit:watch` | Re-run on save                                    | No            | —                         |

Run one file:

```bash
pnpm test:unit -- patients.service
```

---

## 3. Which test do I write?

**Pick the simplest layer that can prove your change.**

```
Is it pure logic (a calculation, a rule, a status check)?
   → UNIT test.  File: <thing>.spec.ts  (next to the code)

Does it depend on the database (a query, a constraint, a transaction)?
   → INTEGRATION test.  File: <thing>.int-spec.ts

Does it need a real HTTP request through auth + validation?
   → E2E test.  File: <thing>.e2e-spec.ts  (in test/)
```

---

## 4. Copy-paste templates

### Unit (no database)

See [`src/modules/patients/patients.service.spec.ts`](../src/modules/patients/patients.service.spec.ts).

```typescript
describe('MyService (unit)', () => {
  let service: MyService;
  beforeEach(() => {
    service = new MyService(/* pass mocks here */);
  });

  it('does the thing for the normal case', () => {
    expect(service.doThing(2, 3)).toBe(5);
  });
});
```

### Integration (real database)

See [`test/integration/harness.int-spec.ts`](../test/integration/harness.int-spec.ts).

```typescript
import type { PrismaClient } from '@prisma/client';
import { getTestPrisma } from '../support/prisma-test-client';
import { resetDb } from '../support/reset-db';
import { createRole } from '../support/factories/role.factory';

describe('Roles (int)', () => {
  let prisma: PrismaClient;
  beforeAll(() => {
    prisma = getTestPrisma();
  });
  beforeEach(() => resetDb(prisma)); // clean DB before each test

  it('rejects a duplicate code', async () => {
    await createRole(prisma, { code: 'DUP' });
    await expect(createRole(prisma, { code: 'DUP' })).rejects.toThrow();
  });
});
```

- Build data with **factories** in `test/support/factories/`. Don't hand-write full
  entities. Copy `role.factory.ts` to make new ones (`buildX` = object, `createX` = saved).
- The database is **wiped before every test** (`resetDb`), so tests don't leak into each other.

---

## 5. The safety rule (important)

These folders are patient-safety code and are held to **95% test coverage**:

```
src/modules/clinical    pharmacy    laboratory    billing
```

If you add a `.ts` file there **without enough tests, `pnpm test:cov` fails.**
That's on purpose — a bug in allergy checks, drug interactions, dosages or billing
can hurt a patient. Every safety rule needs 4 tests:

1. the normal allowed case,
2. the dangerous case is **blocked**,
3. the edge case (boundary values),
4. the override case (needs a reason + writes an audit log).

> Each of those 4 folders currently has a placeholder `index.ts` + `index.spec.ts`.
> **Delete the placeholder** when you build the real module there.

---

## 6. Troubleshooting

| Problem                                                               | Fix                                                                                        |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `Could not find a working container runtime`                          | `colima start`                                                                             |
| `test:int` is slow the first time                                     | Normal — it pulls the `postgres:15` image once. Later runs are fast.                       |
| `Coverage … threshold (95%) not met` in clinical/pharmacy/lab/billing | You added safety code without tests. Add tests until it passes. Do **not** lower the 95%.  |
| Global coverage threshold fails                                       | The global baseline is intentionally low for now; if you dropped real coverage, add tests. |
| e2e login fails with `Invalid credentials`                            | Check `UsersSeeder` ran; test setup seeds `admin@example.com` / `ChangeMe123!`.            |

---

That's it. Unit-test by default, reach for integration when the database matters, and
never skip tests on safety-critical modules.
