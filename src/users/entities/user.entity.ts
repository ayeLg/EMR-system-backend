import { Role } from '@/roles/role.enum';

export class User {
  id!: string;
  email!: string;
  passwordHash!: string;
  fullName!: string;
  role!: Role;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
