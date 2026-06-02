import { MongoAbility } from '@casl/ability';
import { Action } from './action.enum';
import { AppSubjects } from './subjects';

export type AppAbility = MongoAbility<[Action, AppSubjects]>;
