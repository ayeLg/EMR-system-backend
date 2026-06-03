import { Injectable, OnModuleInit } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Role } from '@/roles/role.enum';
import type { User, UserRecord } from './entities/user.entity';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly users = new Map<string, UserRecord>();

  async onModuleInit(): Promise<void> {
    if (this.users.size > 0) {
      return;
    }
    await this.seedDemoUsers();
  }

  findById(id: string): UserRecord | undefined {
    return this.users.get(id);
  }

  findByEmail(email: string): UserRecord | undefined {
    return [...this.users.values()].find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  findAll(): User[] {
    return [...this.users.values()].map((user) => this.sanitize(user));
  }

  sanitize(user: User | UserRecord): User {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private async seedDemoUsers(): Promise<void> {
    const passwordHash = await bcrypt.hash('password123', 10);
    const now = new Date();
    const seeds: User[] = [
      {
        id: '1',
        email: 'admin@example.com',
        fullName: 'System Admin',
        role: Role.SuperAdmin,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '2',
        email: 'doctor@example.com',
        fullName: 'Dr. Jane Doe',
        role: Role.Doctor,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '3',
        email: 'nurse@example.com',
        fullName: 'Nurse Sam',
        role: Role.Nurse,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '4',
        email: 'reception@example.com',
        fullName: 'Front Desk',
        role: Role.Receptionist,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ];

    for (const seed of seeds) {
      this.users.set(seed.id, { ...seed, passwordHash });
    }
  }
}
