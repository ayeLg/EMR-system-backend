import { Action } from '@/authorization/casl/types';
import { PolicyHandlerCallback } from '@/authorization/casl/interfaces/policy-handler.interface';
import { ENCOUNTER_SUBJECT } from '@/authorization/casl/types/subjects';

export const readEncounterPolicy = (): PolicyHandlerCallback => (ability) =>
  ability.can(Action.Read, ENCOUNTER_SUBJECT) ||
  ability.can(Action.Manage, ENCOUNTER_SUBJECT);

export const updateEncounterPolicy = (): PolicyHandlerCallback => (ability) =>
  ability.can(Action.Update, ENCOUNTER_SUBJECT) ||
  ability.can(Action.Manage, ENCOUNTER_SUBJECT);
