/** Canonical permission rows — safe for Prisma seeders (no path aliases). */
export const RBAC_MODULES = [
  { module: 'patient', resource: 'Patient' },
  { module: 'appointment', resource: 'Appointment' },
  { module: 'encounter', resource: 'Encounter' },
  { module: 'pharmacy', resource: 'Pharmacy' },
  { module: 'laboratory', resource: 'Laboratory' },
  { module: 'radiology', resource: 'Radiology' },
  { module: 'billing', resource: 'Billing' },
  { module: 'report', resource: 'Report' },
  { module: 'user', resource: 'User' },
  { module: 'settings', resource: 'Settings' },
] as const;

export const CRUD_ACTIONS = ['read', 'create', 'update', 'delete'] as const;

export type CrudAction = (typeof CRUD_ACTIONS)[number];

export const PERMISSION_DEFINITIONS = RBAC_MODULES.flatMap(
  ({ module, resource }) =>
    CRUD_ACTIONS.map((action) => ({ module, action, resource })),
);

export type PermissionKey =
  `${(typeof RBAC_MODULES)[number]['module']}:${CrudAction}`;

export function toPermissionKey(module: string, action: string): string {
  return `${module}:${action}`;
}
