import { Action } from '@/authorization/casl/types';
import { PolicyHandlerCallback } from '@/authorization/casl/interfaces/policy-handler.interface';

export const read__Feature__Policy = (): PolicyHandlerCallback => (ability) =>
  ability.can(Action.Read, '__Feature__');

export const create__Feature__Policy = (): PolicyHandlerCallback => (ability) =>
  ability.can(Action.Create, '__Feature__');

export const update__Feature__Policy = (): PolicyHandlerCallback => (ability) =>
  ability.can(Action.Update, '__Feature__');

export const delete__Feature__Policy = (): PolicyHandlerCallback => (ability) =>
  ability.can(Action.Delete, '__Feature__');
