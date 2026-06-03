import { Action } from '@/casl/types';
import { AppSubjects, Subjects } from '@/casl/types/subjects';
import { Role } from './role.enum';

export interface RoleRule {
  action: Action | Action[];
  subject: AppSubjects;
  inverted?: boolean;
}

export const ROLE_PERMISSIONS: Record<Role, RoleRule[]> = {
  [Role.SuperAdmin]: [],
  [Role.Admin]: [
    { action: Action.Manage, subject: Subjects.User },
    { action: Action.Manage, subject: Subjects.Patient },
  ],
  [Role.Doctor]: [
    { action: Action.Read, subject: Subjects.Patient },
    { action: Action.Update, subject: Subjects.Patient },
    { action: Action.Read, subject: Subjects.User },
  ],
  [Role.Nurse]: [
    { action: Action.Read, subject: Subjects.Patient },
    { action: Action.Update, subject: Subjects.Patient },
  ],
  [Role.Receptionist]: [
    { action: Action.Read, subject: Subjects.Patient },
    { action: Action.Create, subject: Subjects.Patient },
  ],
};
