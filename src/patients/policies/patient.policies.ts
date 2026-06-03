import { Action } from '@/casl/types';
import { PolicyHandlerCallback } from '@/casl/interfaces/policy-handler.interface';
import { Subjects } from '@/casl/types/subjects';

export const readPatientPolicy = (): PolicyHandlerCallback => (ability) =>
  ability.can(Action.Read, Subjects.Patient);

export const createPatientPolicy = (): PolicyHandlerCallback => (ability) =>
  ability.can(Action.Create, Subjects.Patient);

export const updatePatientPolicy = (): PolicyHandlerCallback => (ability) =>
  ability.can(Action.Update, Subjects.Patient);

export const deletePatientPolicy = (): PolicyHandlerCallback => (ability) =>
  ability.can(Action.Delete, Subjects.Patient);
