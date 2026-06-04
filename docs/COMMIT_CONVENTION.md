# Commit Message Convention

This repository enforces **[Conventional Commits](https://www.conventionalcommits.org/)**.
Commit messages are checked automatically by **commitlint** (via a husky
`commit-msg` git hook). A commit with a non-conforming message is rejected.

---

## Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

- **header** (first line) is **required**: `<type>(<scope>): <subject>`
- **body** and **footer** are optional (separated by one blank line)

### Rules

| Part      | Rule                                                                                                                         |
| --------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `type`    | Required. Lowercase. One of the types below.                                                                                 |
| `scope`   | Optional. The area touched, e.g. `patients`, `auth`. In parentheses.                                                         |
| `subject` | Required. Imperative mood ("add", not "added"/"adds"). Lowercase start. **No trailing period.** Keep the header ≤ 150 chars. |
| `body`    | Optional. Explain **what** and **why** (not how). Wrap lines ≤ 100 chars.                                                    |
| `footer`  | Optional. `BREAKING CHANGE: ...` and issue refs like `Refs #123`.                                                            |

---

## Types

| Type       | When to use                                             |
| ---------- | ------------------------------------------------------- |
| `feat`     | A new feature                                           |
| `fix`      | A bug fix                                               |
| `docs`     | Documentation only                                      |
| `style`    | Formatting, whitespace (no code-behavior change)        |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf`     | Performance improvement                                 |
| `test`     | Adding or fixing tests                                  |
| `build`    | Build system or dependencies (e.g. pnpm, prisma bump)   |
| `ci`       | CI configuration                                        |
| `chore`    | Tooling/config/maintenance, no src behavior change      |
| `revert`   | Reverts a previous commit                               |

## Suggested scopes (this project)

`auth`, `patients`, `appointments`, `clinical`, `pharmacy`, `laboratory`,
`billing`, `users`, `reports`, `prisma`, `config`, `security`, `deps`

---

## Examples

✅ **Good**

```
feat(patients): add patient registration endpoint
fix(auth): correct JWT refresh token expiry
docs: update backend setup instructions
chore(deps): bump prisma to 7.8
refactor(casl): move ability factory to authorization module
test(patients): cover not-found path in service
```

✅ **Good (with body + breaking change)**

```
feat(auth): require TOTP for DOCTOR and SUPER_ADMIN roles

Adds a second-factor step to the login flow. Enrollment stores an
encrypted TOTP secret on the user.

BREAKING CHANGE: login response now returns `mfaRequired` instead of a token
when 2FA is enabled.
```

❌ **Bad** (will be rejected)

```
update                     # no type, no subject
fixed bug                  # no type
Feat: Add Patient          # type/subject must be lowercase
feat: added patients.      # past tense + trailing period
```

---

## Git hooks in this repo

| Hook         | Runs                                                                            | Purpose                                                                                           |
| ------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `pre-commit` | `prettier` (format staged) + `pnpm lint:check` (type-aware lint, whole project) | Keep code formatted and lint-clean. Blocks the commit and prints `file:line:rule` on real errors. |
| `commit-msg` | `commitlint`                                                                    | Enforces this convention.                                                                         |

Hooks are installed automatically on `pnpm install` (husky `prepare` script).

### Bypassing (emergencies only)

```bash
git commit -m "feat: ..." --no-verify
```

`--no-verify` skips **both** hooks. Use sparingly — CI still runs lint/tests.

---

## Quick reference

```bash
git add -A
git commit -m "feat(patients): implement patient module with CRUD and CASL policies"
git push
```
