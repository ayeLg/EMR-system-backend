import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import {
  caslRuleForPermissionKey,
  toPermissionKey,
} from '@/authorization/permissions/permission-keys';
import type { RoleRule } from '@/authorization/roles/role-permissions';

@Injectable()
export class RbacService {
  constructor(private readonly prisma: PrismaService) {}

  async listPermissions() {
    const rows = await this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });
    return rows.map((p) => ({
      id: p.id,
      module: p.module,
      action: p.action,
      resource: p.resource,
      key: toPermissionKey(p.module, p.action),
    }));
  }

  async listRolesWithPermissions() {
    const roles = await this.prisma.role.findMany({
      orderBy: { name: 'asc' },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
    });

    return roles.map((role) => ({
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      userCount: role._count.users,
      permissions: role.permissions.map((rp) => ({
        id: rp.permission.id,
        key: toPermissionKey(rp.permission.module, rp.permission.action),
        module: rp.permission.module,
        action: rp.permission.action,
        resource: rp.permission.resource,
      })),
    }));
  }

  async getPermissionKeysForRole(
    roleId: string,
    roleCode: string,
  ): Promise<string[]> {
    if (roleCode === 'SUPER_ADMIN') {
      const all = await this.prisma.permission.findMany();
      return all.map((p) => toPermissionKey(p.module, p.action));
    }

    const rows = await this.prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    });
    return rows.map((r) =>
      toPermissionKey(r.permission.module, r.permission.action),
    );
  }

  caslRulesFromPermissionKeys(keys: string[]): RoleRule[] {
    const rules: RoleRule[] = [];
    const seen = new Set<string>();

    for (const key of keys) {
      const mapped = caslRuleForPermissionKey(key);
      if (!mapped) continue;
      const sig = `${mapped.action}:${mapped.subject}`;
      if (seen.has(sig)) continue;
      seen.add(sig);
      rules.push({ action: mapped.action, subject: mapped.subject });
    }

    return rules;
  }

  async setRolePermissions(roleId: string, permissionIds: string[]) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException(`Role ${roleId} not found`);
    }

    if (role.code === 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'SUPER_ADMIN permissions cannot be modified',
      );
    }

    const valid = await this.prisma.permission.findMany({
      where: { id: { in: permissionIds } },
    });
    if (valid.length !== permissionIds.length) {
      throw new NotFoundException('One or more permission IDs are invalid');
    }

    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId } }),
      this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
        skipDuplicates: true,
      }),
    ]);

    return this.listRolesWithPermissions().then((roles) =>
      roles.find((r) => r.id === roleId),
    );
  }
}
