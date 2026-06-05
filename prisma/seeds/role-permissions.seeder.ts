import {
  CRUD_ACTIONS,
  toPermissionKey,
} from '../../src/authorization/permissions/permission-definitions';
import { Seeder } from './seeder';

function crud(
  module: string,
  actions: (typeof CRUD_ACTIONS)[number][],
): string[] {
  return actions.map((action) => toPermissionKey(module, action));
}

/** Default role → permission keys. */
const ROLE_PERMISSION_KEYS: Record<string, readonly string[]> = {
  DOCTOR: [
    ...crud('patient', ['read', 'create', 'update']),
    ...crud('appointment', ['read', 'create', 'update']),
    ...crud('encounter', ['read', 'create', 'update']),
    ...crud('laboratory', ['read']),
    ...crud('report', ['read']),
  ],
  NURSE: [
    ...crud('patient', ['read']),
    ...crud('appointment', ['read']),
    ...crud('encounter', ['read', 'update']),
  ],
  RECEPTIONIST: [
    ...crud('patient', ['read', 'create']),
    ...crud('appointment', ['read', 'create', 'update']),
  ],
  PHARMACIST: [
    ...crud('patient', ['read']),
    ...crud('pharmacy', ['read', 'create', 'update']),
  ],
  LAB_TECH: [
    ...crud('patient', ['read']),
    ...crud('laboratory', ['read', 'create', 'update']),
  ],
  BILLING_STAFF: [
    ...crud('patient', ['read']),
    ...crud('billing', ['read', 'create', 'update']),
    ...crud('report', ['read']),
  ],
  PATIENT: [...crud('patient', ['read']), ...crud('appointment', ['read'])],
};

export const RolePermissionsSeeder: Seeder = {
  name: 'RolePermissionsSeeder',
  async run(prisma) {
    const permissions = await prisma.permission.findMany();
    const byKey = new Map(
      permissions.map((p) => [toPermissionKey(p.module, p.action), p.id]),
    );
    const allPermissionIds = permissions.map((p) => p.id);

    const roles = await prisma.role.findMany();

    for (const role of roles) {
      await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });

      let permissionIds: string[];

      if (role.code === 'SUPER_ADMIN') {
        permissionIds = allPermissionIds;
      } else {
        const keys = ROLE_PERMISSION_KEYS[role.code] ?? [];
        permissionIds = keys
          .map((key) => byKey.get(key))
          .filter((id): id is string => Boolean(id));
      }

      if (permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId: role.id,
            permissionId,
          })),
          skipDuplicates: true,
        });
      }
    }
  },
};
