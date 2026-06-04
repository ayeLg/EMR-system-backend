import * as bcrypt from 'bcryptjs';
import { Seeder } from './seeder';

/**
 * Seeds a bootstrap SUPER_ADMIN account. Depends on RolesSeeder (must run after
 * it) — demonstrates ordered seeding. Idempotent via upsert on the unique
 * username. Default password is dev-only; force a change after first login.
 */
export const UsersSeeder: Seeder = {
  name: 'UsersSeeder',
  async run(prisma) {
    const adminRole = await prisma.role.findUnique({
      where: { code: 'SUPER_ADMIN' },
    });
    if (!adminRole) {
      throw new Error('SUPER_ADMIN role missing — run RolesSeeder first');
    }

    const passwordHash = await bcrypt.hash('ChangeMe123!', 10);

    await prisma.user.upsert({
      where: { username: 'admin' },
      update: {
        employeeId: 'EMP-0000001',
        email: 'admin@example.com',
        fullName: 'System Administrator',
        passwordHash,
        roleId: adminRole.id,
        status: 'ACTIVE',
      },
      create: {
        employeeId: 'EMP-0000001',
        username: 'admin',
        email: 'admin@example.com',
        fullName: 'System Administrator',
        passwordHash,
        roleId: adminRole.id,
        status: 'ACTIVE',
      },
    });
  },
};
