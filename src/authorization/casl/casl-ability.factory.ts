import { Injectable } from '@nestjs/common';
import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import { Action, AppAbility } from '@/authorization/casl/types';
import { Role } from '@/authorization/roles/role.enum';
import type { User } from '@/modules/users/entities/user.entity';
import { ROLE_PERMISSIONS } from '@/authorization/roles/role-permissions';

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: User): AppAbility {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
      createMongoAbility,
    );

    const rules = ROLE_PERMISSIONS[user.role] ?? [];
    for (const rule of rules) {
      const apply = rule.inverted ? cannot : can;
      apply(rule.action, rule.subject);
    }

    if (user.role === Role.SuperAdmin) {
      can(Action.Manage, 'all');
    }

    return build();
  }
}
