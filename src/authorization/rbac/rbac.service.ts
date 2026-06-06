import {
  ConflictException,
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
      include: this.roleInclude(),
    });

    return roles.map((role) => this.toRoleResponse(role));
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

  private toRoleResponse(role: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    permissions: Array<{
      permission: {
        id: string;
        module: string;
        action: string;
        resource: string;
      };
    }>;
    _count: { users: number };
  }) {
    return {
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
    };
  }

  private roleInclude() {
    return {
      permissions: { include: { permission: true } },
      _count: { select: { users: true } },
    } as const;
  }

  private generateRoleCode(name: string): string {
    const base = name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 45);
    return base.length > 0 ? base : 'CUSTOM_ROLE';
  }

  async createRole(dto: { name: string; description?: string }) {
    let code = this.generateRoleCode(dto.name);
    let suffix = 1;
    while (await this.prisma.role.findUnique({ where: { code } })) {
      code = `${this.generateRoleCode(dto.name)}_${suffix}`;
      suffix += 1;
    }

    const role = await this.prisma.role.create({
      data: {
        code,
        name: dto.name,
        description: dto.description,
      },
      include: this.roleInclude(),
    });

    return this.toRoleResponse(role);
  }

  async updateRole(
    roleId: string,
    dto: { name?: string; description?: string },
  ) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: { _count: { select: { users: true } } },
    });
    if (!role) {
      throw new NotFoundException(`Role ${roleId} not found`);
    }

    if (role.code === 'SUPER_ADMIN' && dto.name && dto.name !== role.name) {
      throw new ForbiddenException('SUPER_ADMIN role name cannot be changed');
    }

    const updated = await this.prisma.role.update({
      where: { id: roleId },
      data: dto,
      include: this.roleInclude(),
    });

    return this.toRoleResponse(updated);
  }

  async deleteRole(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: { _count: { select: { users: true } } },
    });
    if (!role) {
      throw new NotFoundException(`Role ${roleId} not found`);
    }

    if (role.code === 'SUPER_ADMIN') {
      throw new ForbiddenException('SUPER_ADMIN cannot be deleted');
    }

    if (role._count.users > 0) {
      throw new ConflictException(
        `Role "${role.name}" is assigned to ${role._count.users} user(s)`,
      );
    }

    await this.prisma.role.delete({ where: { id: roleId } });
    return { deleted: true };
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
