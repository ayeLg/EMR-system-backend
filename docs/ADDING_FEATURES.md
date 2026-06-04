# Adding a new feature

This starter uses **feature modules** (NestJS) with **CASL** policy guards on routes.

## Quick start

```bash
pnpm generate:feature appointments Appointment appointment
```

Or copy `templates/feature/` manually and replace `__feature__` / `__Feature__` tokens.

## Integration checklist

| Step | File(s)                                       | Action                                                     |
| ---- | --------------------------------------------- | ---------------------------------------------------------- |
| 1    | `src/modules/<feature>/`                      | Create module, controller, service, DTOs, entity, policies |
| 2    | `src/app.module.ts`                           | Import `<Feature>Module`                                   |
| 3    | `src/authorization/casl/types/subjects.ts`    | Add a subject string/constant                              |
| 4    | `src/authorization/roles/role-permissions.ts` | Define `can` rules per `Role`                              |
| 5    | `src/modules/<feature>/*.controller.ts`       | Add `@CheckPolicies(...)` per route                        |
| 6    | Service                                       | Use `PrismaService` for persistence and transactions       |
| 7    | Tests                                         | Unit test service; test abilities via `CaslAbilityFactory` |

## Authorization pattern

Every protected route should use a policy from `policies/<feature>.policies.ts`:

```typescript
@CheckPolicies(readPatientPolicy())
@Get()
findAll() { ... }
```

Policies are evaluated by the global `PoliciesGuard` after `JwtAuthGuard` attaches `request.user`.

## Role changes

Edit `src/authorization/roles/role-permissions.ts` only — do not hard-code role checks in controllers. Use CASL for all authorization decisions.

For **instance-level** rules (e.g. doctors may only update their own patients), add `conditions` to rules and pass entity instances to `ability.can(action, subjectInstance)`.

## Public routes

Use `@Public()` on handlers that skip JWT (e.g. login, health).

## Swagger

- Add `@ApiTags('<feature>')` on the controller
- Protected modules: `@ApiBearerAuth(SWAGGER_BEARER_AUTH)` (import from `@/common/swagger/setup-swagger`)
- Document responses with `*-response.dto.ts` classes using `@ApiProperty`
- Register a tag in `src/common/swagger/setup-swagger.ts` if you want a grouped section

## Reference implementation

See `src/modules/patients/` as the canonical example feature module.

## Data and seeders

If the feature needs reference data, create a seeder with:

```bash
pnpm make:seeder <Name>
```

Register order matters: dependencies such as roles or lookup tables must run
before seeders that reference them. Keep seeders idempotent with `upsert` so
`pnpm db:seed` and `pnpm db:fresh` stay safe to rerun.
