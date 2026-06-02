import { Action } from '@/casl/types';
import { Patient } from '@/patients/entities/patient.entity';
import { User } from '@/users/entities/user.entity';
import { Role } from './role.enum';

export interface RoleRule {
  action: Action | Action[];
  subject: typeof User | typeof Patient | 'all';
  inverted?: boolean;
}

export const ROLE_PERMISSIONS: Record<Role, RoleRule[]> = {
  [Role.SuperAdmin]: [],
  [Role.Admin]: [
    { action: Action.Manage, subject: User },
    { action: Action.Manage, subject: Patient },
  ],
  [Role.Doctor]: [
    { action: Action.Read, subject: Patient },
    { action: Action.Update, subject: Patient },
    { action: Action.Read, subject: User },
  ],
  [Role.Nurse]: [
    { action: Action.Read, subject: Patient },
    { action: Action.Update, subject: Patient },
  ],
  [Role.Receptionist]: [
    { action: Action.Read, subject: Patient },
    { action: Action.Create, subject: Patient },
  ],
};
