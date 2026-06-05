import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { Role } from '@/authorization/roles/role.enum';
import { RbacService } from '@/authorization/rbac/rbac.service';
import { PrismaService } from '@/prisma/prisma.service';
import type { User, UserRecord } from './entities/user.entity';

type UserWithRole = Prisma.UserGetPayload<{ include: { role: true } }>;

const ROLE_BY_CODE: Record<string, Role> = {
  SUPER_ADMIN: Role.SuperAdmin,
  ADMIN: Role.Admin,
  DOCTOR: Role.Doctor,
  NURSE: Role.Nurse,
  RECEPTIONIST: Role.Receptionist,
  PHARMACIST: Role.Pharmacist,
  LAB_TECH: Role.LabTech,
  BILLING_STAFF: Role.BillingStaff,
  PATIENT: Role.Patient,
};

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rbac: RbacService,
  ) {}

  async findById(id: string): Promise<UserRecord | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
    return user ? await this.toUserRecord(user) : null;
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        email: { equals: email, mode: 'insensitive' },
      },
      include: { role: true },
    });
    return user ? await this.toUserRecord(user) : null;
  }

  async findAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      include: { role: true },
      orderBy: { createdAt: 'desc' },
    });
    const records = await Promise.all(
      users.map((user) => this.toUserRecord(user)),
    );
    return records.map((user) => this.sanitize(user));
  }

  sanitize(user: User | UserRecord): User {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      roleCode: user.roleCode,
      permissions: user.permissions,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private async toUserRecord(user: UserWithRole): Promise<UserRecord> {
    const roleCode = user.role.code;
    const permissions = await this.rbac.getPermissionKeysForRole(
      user.roleId,
      roleCode,
    );

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: this.toAppRole(roleCode),
      roleCode,
      permissions,
      isActive: user.status === 'ACTIVE',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      passwordHash: user.passwordHash,
    };
  }

  private toAppRole(code: string): Role {
    return ROLE_BY_CODE[code] ?? Role.Receptionist;
  }
}
