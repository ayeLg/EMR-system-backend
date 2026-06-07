import { prisma } from '../prisma/client';

async function main() {
  try {
    const roles = await prisma.role.findMany({
      include: {
        _count: { select: { users: true } },
      },
    });
    console.log('--- ROLES ---');
    console.log(
      roles.map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        users: r._count.users,
      })),
    );

    const permissions = await prisma.permission.findMany({
      take: 10,
    });
    console.log('\n--- FIRST 10 PERMISSIONS ---');
    console.log(permissions);

    const totalPermissions = await prisma.permission.count();
    console.log('\nTotal Permissions in DB:', totalPermissions);

    const totalRolePermissions = await prisma.rolePermission.count();
    console.log('Total RolePermissions in DB:', totalRolePermissions);
  } catch (error) {
    console.error('Inspection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
