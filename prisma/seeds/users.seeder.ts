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

    const doctorRole = await prisma.role.findUnique({
      where: { code: 'DOCTOR' },
    });
    if (doctorRole) {
      const doctorPasswordHash = await bcrypt.hash('ChangeMe123!', 10);
      const doctors = [
        {
          username: 'dr.aung',
          email: 'aung.doctor@hospital.mm',
          fullName: 'Dr. Aung Aung',
          employeeId: 'EMP-D001',
        },
        {
          username: 'dr.hla',
          email: 'hla.doctor@hospital.mm',
          fullName: 'Dr. Hla Hla',
          employeeId: 'EMP-D002',
        },
      ] as const;

      for (const doc of doctors) {
        await prisma.user.upsert({
          where: { username: doc.username },
          update: {
            email: doc.email,
            fullName: doc.fullName,
            employeeId: doc.employeeId,
            passwordHash: doctorPasswordHash,
            roleId: doctorRole.id,
            status: 'ACTIVE',
          },
          create: {
            username: doc.username,
            email: doc.email,
            fullName: doc.fullName,
            employeeId: doc.employeeId,
            passwordHash: doctorPasswordHash,
            roleId: doctorRole.id,
            status: 'ACTIVE',
          },
        });
      }
    }
  },
};
