import { Injectable, OnModuleInit } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Role } from '@/roles/role.enum';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly users = new Map<string, User>();

  async onModuleInit(): Promise<void> {
    if (this.users.size > 0) {
      return;
    }
    await this.seedDemoUsers();
  }

  findById(id: string): User | undefined {
    return this.users.get(id);
  }

  findByEmail(email: string): User | undefined {
    return [...this.users.values()].find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  findAll(): User[] {
    return [...this.users.values()].map((user) => this.sanitize(user));
  }

  sanitize(user: User): User {
    const { passwordHash: _, ...safe } = user;
    return new User(safe);
  }

  private async seedDemoUsers(): Promise<void> {
    const passwordHash = await bcrypt.hash('password123', 10);
    const now = new Date();
    const seeds: Array<Omit<User, 'passwordHash'> & { passwordHash?: string }> =
      [
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
      this.users.set(seed.id, new User({ ...seed, passwordHash } as User));
    }
  }
}
