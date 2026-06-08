import { Action } from '@/authorization/casl/types';
import { PolicyHandlerCallback } from '@/authorization/casl/interfaces/policy-handler.interface';
import { APPOINTMENT_SUBJECT } from '@/authorization/casl/types/subjects';

export const readAppointmentPolicy = (): PolicyHandlerCallback => (ability) =>
  ability.can(Action.Read, APPOINTMENT_SUBJECT);

export const createAppointmentPolicy = (): PolicyHandlerCallback => (ability) =>
  ability.can(Action.Create, APPOINTMENT_SUBJECT);

export const updateAppointmentPolicy = (): PolicyHandlerCallback => (ability) =>
  ability.can(Action.Update, APPOINTMENT_SUBJECT);

export const deleteAppointmentPolicy = (): PolicyHandlerCallback => (ability) =>
  ability.can(Action.Delete, APPOINTMENT_SUBJECT);
