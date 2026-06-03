import { Action } from '@/authorization/casl/types';
import {
  AppSubjects,
  PATIENT_SUBJECT,
  USER_SUBJECT,
} from '@/authorization/casl/types/subjects';
import { Role } from './role.enum';

export interface RoleRule {
  action: Action | Action[];
  subject: AppSubjects;
  inverted?: boolean;
}

export const ROLE_PERMISSIONS: Record<Role, RoleRule[]> = {
  [Role.SuperAdmin]: [],
  [Role.Admin]: [
    { action: Action.Manage, subject: USER_SUBJECT },
    { action: Action.Manage, subject: PATIENT_SUBJECT },
  ],
  [Role.Doctor]: [
    { action: Action.Read, subject: PATIENT_SUBJECT },
    { action: Action.Update, subject: PATIENT_SUBJECT },
    { action: Action.Read, subject: USER_SUBJECT },
  ],
  [Role.Nurse]: [
    { action: Action.Read, subject: PATIENT_SUBJECT },
    { action: Action.Update, subject: PATIENT_SUBJECT },
  ],
  [Role.Receptionist]: [
    { action: Action.Read, subject: PATIENT_SUBJECT },
    { action: Action.Create, subject: PATIENT_SUBJECT },
  ],
};
