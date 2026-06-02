import { Action } from '@/casl/types';
import { PolicyHandlerCallback } from '@/casl/interfaces/policy-handler.interface';
import { Patient } from '../entities/patient.entity';

export const readPatientPolicy = (): PolicyHandlerCallback => (ability) =>
  ability.can(Action.Read, Patient);

export const createPatientPolicy = (): PolicyHandlerCallback => (ability) =>
  ability.can(Action.Create, Patient);

export const updatePatientPolicy = (): PolicyHandlerCallback => (ability) =>
  ability.can(Action.Update, Patient);

export const deletePatientPolicy = (): PolicyHandlerCallback => (ability) =>
  ability.can(Action.Delete, Patient);
