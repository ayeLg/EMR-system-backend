# Adding a new feature

This starter uses **feature modules** (NestJS) with **CASL** policy guards on routes.

## Quick start

```bash
chmod +x scripts/generate-feature.sh
./scripts/generate-feature.sh appointments Appointment
```

Or copy `templates/feature/` manually and replace `__feature__` / `__Feature__` tokens.

## Integration checklist

| Step | File(s) | Action |
|------|---------|--------|
| 1 | `src/<feature>/` | Create module, controller, service, DTOs, entity, policies |
| 2 | `src/app.module.ts` | Import `<Feature>Module` |
| 3 | `src/casl/types/subjects.ts` | Add entity to `AppSubjects` union |
| 4 | `src/roles/role-permissions.ts` | Define `can` rules per `Role` |
| 5 | `src/<feature>/*.controller.ts` | Add `@CheckPolicies(...)` per route |
| 6 | Service | Swap in-memory `Map` for database repository |
| 7 | Tests | Unit test service; test abilities via `CaslAbilityFactory` |

## Authorization pattern

Every protected route should use a policy from `policies/<feature>.policies.ts`:

```typescript
@CheckPolicies(readPatientPolicy())
@Get()
findAll() { ... }
```

Policies are evaluated by the global `PoliciesGuard` after `JwtAuthGuard` attaches `request.user`.

## Role changes

Edit `src/roles/role-permissions.ts` only — do not hard-code role checks in controllers. Use CASL for all authorization decisions.

For **instance-level** rules (e.g. doctors may only update their own patients), add `conditions` to rules and pass entity instances to `ability.can(action, subjectInstance)`.

## Public routes

Use `@Public()` on handlers that skip JWT (e.g. login, health).

## Swagger

- Add `@ApiTags('<feature>')` on the controller
- Protected modules: `@ApiBearerAuth(SWAGGER_BEARER_AUTH)` (import from `@/common/swagger/setup-swagger`)
- Document responses with `*-response.dto.ts` classes using `@ApiProperty`
- Register a tag in `src/common/swagger/setup-swagger.ts` if you want a grouped section

## Reference implementation

See `src/patients/` as the canonical example feature module.
