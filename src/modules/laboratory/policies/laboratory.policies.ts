import { PolicyHandlerCallback } from '@/authorization/casl/interfaces/policy-handler.interface';
import { Action } from '@/authorization/casl/types';
import { PATIENT_SUBJECT } from '@/authorization/casl/types/subjects';

export const readLaboratoryPolicy = (): PolicyHandlerCallback => (ability) =>
  ability.can(Action.Read, PATIENT_SUBJECT) ||
  ability.can(Action.Manage, PATIENT_SUBJECT);

export const updateLaboratoryPolicy = (): PolicyHandlerCallback => (ability) =>
  ability.can(Action.Update, PATIENT_SUBJECT) ||
  ability.can(Action.Manage, PATIENT_SUBJECT);
