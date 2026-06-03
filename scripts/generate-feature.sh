#!/usr/bin/env bash
# Scaffold a new feature module from templates/feature/
# Usage: ./scripts/generate-feature.sh appointments Appointment [prismaDelegate]

set -euo pipefail

if [ $# -lt 2 ]; then
  echo "Usage: $0 <kebab-name> <PascalName> [prismaDelegate]"
  echo "Example: $0 appointments Appointment appointment"
  exit 1
fi

KEBAB="$1"
PASCAL="$2"
PRISMA="${3:-$(printf '%s' "$PASCAL" | awk '{ print tolower(substr($0, 1, 1)) substr($0, 2) }')}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEMPLATE_DIR="$ROOT/templates/feature"
TARGET_DIR="$ROOT/src/$KEBAB"

if [ -d "$TARGET_DIR" ]; then
  echo "Directory already exists: $TARGET_DIR"
  exit 1
fi

mkdir -p "$TARGET_DIR/dto" "$TARGET_DIR/policies" "$TARGET_DIR/entities"

render() {
  sed \
    -e "s/__feature__/$KEBAB/g" \
    -e "s/__Feature__/$PASCAL/g" \
    -e "s/__prisma__/$PRISMA/g" \
    "$1"
}

render "$TEMPLATE_DIR/__feature__.module.ts" > "$TARGET_DIR/$KEBAB.module.ts"
render "$TEMPLATE_DIR/__feature__.controller.ts" > "$TARGET_DIR/$KEBAB.controller.ts"
render "$TEMPLATE_DIR/__feature__.service.ts" > "$TARGET_DIR/$KEBAB.service.ts"
render "$TEMPLATE_DIR/entities/__feature__.entity.ts" > "$TARGET_DIR/entities/$KEBAB.entity.ts"
render "$TEMPLATE_DIR/dto/create-__feature__.dto.ts" > "$TARGET_DIR/dto/create-$KEBAB.dto.ts"
render "$TEMPLATE_DIR/dto/list-__feature__.dto.ts" > "$TARGET_DIR/dto/list-$KEBAB.dto.ts"
render "$TEMPLATE_DIR/dto/update-__feature__.dto.ts" > "$TARGET_DIR/dto/update-$KEBAB.dto.ts"
render "$TEMPLATE_DIR/policies/__feature__.policies.ts" > "$TARGET_DIR/policies/$KEBAB.policies.ts"

echo "Created feature at src/$KEBAB"
echo "Next steps:"
echo "  1. Register ${PASCAL}Module in src/app.module.ts"
echo "  2. Add ${PASCAL} to src/casl/types/subjects.ts"
echo "  3. Add role rules in src/roles/role-permissions.ts"
echo "  4. Confirm Prisma delegate name: ${PRISMA}"
echo "  5. Replace placeholder DTO/search fields with real ${PASCAL} fields"
