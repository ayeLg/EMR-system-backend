# Feature module template

Copy or generate a new feature module from these files.

## Generate with script

```bash
chmod +x scripts/generate-feature.sh
./scripts/generate-feature.sh appointments Appointment
```

## Manual checklist

After creating `src/<feature>/`:

1. **Register module** — import `<Feature>Module` in `src/app.module.ts`
2. **CASL subject** — add the entity class to `src/casl/types/subjects.ts`
3. **Role permissions** — add rules in `src/roles/role-permissions.ts` per role
4. **Policies** — wire `@CheckPolicies()` on each controller route
5. **Persistence** — replace the in-memory `Map` in the service with your ORM repository
6. **Tests** — add unit tests for service and `*.policies.ts` behavior via `CaslAbilityFactory`

See [docs/ADDING_FEATURES.md](../docs/ADDING_FEATURES.md) and [AGENTS.md](../AGENTS.md) for full guidance.
