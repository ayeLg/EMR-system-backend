import { Action } from '@/authorization/casl/types';
import {
  APPOINTMENT_SUBJECT,
  AppSubjects,
  MASTER_DATA_SUBJECT,
  PATIENT_SUBJECT,
  USER_SUBJECT,
} from '@/authorization/casl/types/subjects';
import {
  CRUD_ACTIONS,
  PERMISSION_DEFINITIONS,
  RBAC_MODULES,
  type PermissionKey,
  toPermissionKey,
} from './permission-definitions';

export {
  PERMISSION_DEFINITIONS,
  RBAC_MODULES,
  CRUD_ACTIONS,
  type PermissionKey,
  toPermissionKey,
};

const MODULE_TO_SUBJECT: Record<string, AppSubjects> = {
  patient: PATIENT_SUBJECT,
  appointment: APPOINTMENT_SUBJECT,
  encounter: PATIENT_SUBJECT,
  pharmacy: PATIENT_SUBJECT,
  laboratory: PATIENT_SUBJECT,
  billing: PATIENT_SUBJECT,
  report: PATIENT_SUBJECT,
  user: USER_SUBJECT,
  settings: MASTER_DATA_SUBJECT,
};

const ACTION_MAP: Record<string, Action> = {
  read: Action.Read,
  create: Action.Create,
  update: Action.Update,
  delete: Action.Delete,
  manage: Action.Manage,
};

const CASL_BY_KEY: Record<string, { action: Action; subject: AppSubjects }> =
  {};

for (const def of PERMISSION_DEFINITIONS) {
  const key = toPermissionKey(def.module, def.action);
  const subject = MODULE_TO_SUBJECT[def.module];
  const action = ACTION_MAP[def.action];
  if (subject && action) {
    CASL_BY_KEY[key] = { action, subject };
  }
}

/** Legacy keys kept for existing DB rows until re-seeded. */
CASL_BY_KEY['user:manage'] = { action: Action.Manage, subject: USER_SUBJECT };
CASL_BY_KEY['settings:manage'] = {
  action: Action.Manage,
  subject: MASTER_DATA_SUBJECT,
};

export function caslRuleForPermissionKey(key: string) {
  return CASL_BY_KEY[key];
}
