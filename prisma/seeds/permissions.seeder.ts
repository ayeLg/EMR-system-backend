import { PERMISSION_DEFINITIONS } from '../../src/authorization/permissions/permission-definitions';
import { Seeder } from './seeder';

export const PermissionsSeeder: Seeder = {
  name: 'PermissionsSeeder',
  async run(prisma) {
    for (const perm of PERMISSION_DEFINITIONS) {
      const existing = await prisma.permission.findFirst({
        where: { module: perm.module, action: perm.action },
      });
      if (existing) {
        await prisma.permission.update({
          where: { id: existing.id },
          data: { resource: perm.resource },
        });
      } else {
        await prisma.permission.create({ data: perm });
      }
    }
  },
};
