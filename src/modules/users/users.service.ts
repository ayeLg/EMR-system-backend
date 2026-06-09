import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { Role } from '@/authorization/roles/role.enum';
import { RbacService } from '@/authorization/rbac/rbac.service';
import { PrismaService } from '@/prisma/prisma.service';
import type { User, UserRecord } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { UserResponseDto } from './dto/user-response.dto';

type UserWithRole = Prisma.UserGetPayload<{ include: { role: true } }>;
type UserWithRoleAndDept = Prisma.UserGetPayload<{
  include: { role: true; department: true };
}>;

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

  // --- Staff Management CRUD ---

  async findAllStaff(): Promise<UserResponseDto[]> {
    const users = await this.prisma.user.findMany({
      include: { role: true, department: true },
      orderBy: { createdAt: 'desc' },
    });

    const doctorIds = users
      .filter((u) => u.role.code === 'DOCTOR')
      .map((u) => u.id);
    const schedules = await this.prisma.doctorSchedule.findMany({
      where: {
        doctorId: { in: doctorIds },
        isActive: true,
      },
    });

    const schedulesByDoctor = new Map<
      string,
      Array<{
        id: string;
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        slotMinutes: number;
      }>
    >();

    for (const s of schedules) {
      const list = schedulesByDoctor.get(s.doctorId) || [];
      list.push({
        id: s.id,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        slotMinutes: s.slotMinutes,
      });
      schedulesByDoctor.set(s.doctorId, list);
    }

    return users.map((u) => {
      const res = this.toUserResponse(u);
      if (u.role.code === 'DOCTOR') {
        res.schedules = schedulesByDoctor.get(u.id) || [];
      }
      return res;
    });
  }

  async generateEmployeeId(): Promise<string> {
    const users = await this.prisma.user.findMany({
      where: { employeeId: { startsWith: 'EMP-' } },
      select: { employeeId: true },
    });

    let maxNum = 0;
    for (const u of users) {
      const numPart = u.employeeId.replace('EMP-', '');
      const parsed = parseInt(numPart, 10);
      if (!isNaN(parsed) && parsed > maxNum) {
        maxNum = parsed;
      }
    }

    const nextNum = maxNum + 1;
    return `EMP-${String(nextNum).padStart(3, '0')}`;
  }

  async createStaff(dto: CreateUserDto): Promise<UserResponseDto> {
    // 1. Resolve role code to role record
    const role = await this.prisma.role.findFirst({
      where: { code: { equals: dto.role, mode: 'insensitive' } },
    });
    if (!role) {
      throw new BadRequestException(`Role ${dto.role} does not exist`);
    }

    // 2. Resolve department name/code to department ID
    const departmentId = await this.resolveDepartmentId(dto.department);

    // 3. Generate a unique username from email prefix
    let baseUsername = dto.email
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9_.-]/g, '');
    if (!baseUsername) baseUsername = 'user';
    let username = baseUsername;
    let count = 0;
    while (await this.prisma.user.findUnique({ where: { username } })) {
      count++;
      username = `${baseUsername}${count}`;
    }

    // 4. Hash a default password (e.g. Welcome123!)
    const passwordHash = await bcrypt.hash('Welcome123!', 10);

    // 5. Generate employeeId if not provided
    const employeeId = dto.employeeId || (await this.generateEmployeeId());

    // 6. Create user
    const user = await this.prisma.user.create({
      data: {
        employeeId,
        username,
        email: dto.email,
        fullName: dto.fullName,
        passwordHash,
        roleId: role.id,
        departmentId,
        status: UserStatus.ACTIVE,
      },
      include: { role: true, department: true },
    });

    return this.toUserResponse(user);
  }

  async updateStaff(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const data: Prisma.UserUpdateInput = {
      fullName: dto.fullName,
      employeeId: dto.employeeId,
      email: dto.email,
    };

    // Update role if provided
    if (dto.role) {
      const role = await this.prisma.role.findFirst({
        where: { code: { equals: dto.role, mode: 'insensitive' } },
      });
      if (!role) {
        throw new BadRequestException(`Role ${dto.role} does not exist`);
      }
      data.role = { connect: { id: role.id } };
    }

    // Update department if provided
    if (dto.department !== undefined) {
      const departmentId = await this.resolveDepartmentId(dto.department);
      if (departmentId) {
        data.department = { connect: { id: departmentId } };
      } else {
        data.department = { disconnect: true };
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      include: { role: true, department: true },
    });

    return this.toUserResponse(updated);
  }

  async setStatus(id: string, status: UserStatus): Promise<UserResponseDto> {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status },
      include: { role: true, department: true },
    });

    return this.toUserResponse(updated);
  }

  async deactivateStaff(id: string): Promise<UserResponseDto> {
    return this.setStatus(id, UserStatus.INACTIVE);
  }

  private async resolveDepartmentId(
    nameOrCode?: string | null,
  ): Promise<string | null> {
    if (!nameOrCode) return null;
    const dept = await this.prisma.department.findFirst({
      where: {
        OR: [
          { name: { equals: nameOrCode, mode: 'insensitive' } },
          { code: { equals: nameOrCode, mode: 'insensitive' } },
        ],
      },
    });
    return dept?.id ?? null;
  }

  private toUserResponse(user: UserWithRoleAndDept): UserResponseDto {
    return {
      id: user.id,
      employeeId: user.employeeId,
      fullName: user.fullName,
      email: user.email,
      role: user.role.code,
      department: user.department?.name ?? null,
      status: user.status,
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
