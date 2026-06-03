# Feature module template

Copy or generate a new feature module from these files.

## Generate with script

```bash
chmod +x scripts/generate-feature.sh
./scripts/generate-feature.sh appointments Appointment
```

## Manual checklist

After creating `src/modules/<feature>/`:

1. **Register module** — import `<Feature>Module` in `src/app.module.ts`
2. **CASL subject** — add the subject string to `src/authorization/casl/types/subjects.ts`
3. **Role permissions** — add rules in `src/authorization/roles/role-permissions.ts` per role
4. **Policies** — wire `@CheckPolicies()` on each controller route
5. **Persistence** — pass the Prisma delegate name to the generator or update `__prisma__` in the service
6. **DTO fields** — replace the placeholder `name` field with the model's real create/update shape
7. **Search** — add model-specific search fields in `buildSearchWhere()`

See [docs/ADDING_FEATURES.md](../docs/ADDING_FEATURES.md) and [AGENTS.md](../AGENTS.md) for full guidance.
