import { Action } from '@/authorization/casl/types';
import { PolicyHandlerCallback } from '@/authorization/casl/interfaces/policy-handler.interface';
import { USER_SUBJECT } from '@/authorization/casl/types/subjects';

export const readUserPolicy = (): PolicyHandlerCallback => (ability) =>
  ability.can(Action.Read, USER_SUBJECT) ||
  ability.can(Action.Manage, USER_SUBJECT);

export const manageUserPolicy = (): PolicyHandlerCallback => (ability) =>
  ability.can(Action.Manage, USER_SUBJECT) ||
  ability.can(Action.Create, USER_SUBJECT) ||
  ability.can(Action.Update, USER_SUBJECT) ||
  ability.can(Action.Delete, USER_SUBJECT);
