import { Action } from '@/authorization/casl/types';
import { PolicyHandlerCallback } from '@/authorization/casl/interfaces/policy-handler.interface';
import { PATIENT_SUBJECT } from '@/authorization/casl/types/subjects';

export const readPatientPolicy = (): PolicyHandlerCallback => (ability) =>
  ability.can(Action.Read, PATIENT_SUBJECT);

export const createPatientPolicy = (): PolicyHandlerCallback => (ability) =>
  ability.can(Action.Create, PATIENT_SUBJECT);

export const updatePatientPolicy = (): PolicyHandlerCallback => (ability) =>
  ability.can(Action.Update, PATIENT_SUBJECT);

export const deletePatientPolicy = (): PolicyHandlerCallback => (ability) =>
  ability.can(Action.Delete, PATIENT_SUBJECT);
