import { Action } from '@/authorization/casl/types';
import { PolicyHandlerCallback } from '@/authorization/casl/interfaces/policy-handler.interface';
import { MASTER_DATA_SUBJECT } from '@/authorization/casl/types/subjects';

export const readMasterDataPolicy = (): PolicyHandlerCallback => (ability) =>
  ability.can(Action.Read, MASTER_DATA_SUBJECT) ||
  ability.can(Action.Manage, MASTER_DATA_SUBJECT);

export const manageMasterDataPolicy = (): PolicyHandlerCallback => (ability) =>
  ability.can(Action.Manage, MASTER_DATA_SUBJECT) ||
  ability.can(Action.Create, MASTER_DATA_SUBJECT) ||
  ability.can(Action.Update, MASTER_DATA_SUBJECT) ||
  ability.can(Action.Delete, MASTER_DATA_SUBJECT);
