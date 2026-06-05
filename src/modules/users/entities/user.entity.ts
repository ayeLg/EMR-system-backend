import { Role } from '@/authorization/roles/role.enum';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  roleCode: string;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRecord extends User {
  passwordHash: string;
}
