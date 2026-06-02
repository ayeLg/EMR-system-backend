import { Injectable } from '@nestjs/common';
import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import { Action, AppAbility, AppSubjects } from '@/casl/types';
import { Role } from '@/roles/role.enum';
import { User } from '@/users/entities/user.entity';
import { ROLE_PERMISSIONS } from '@/roles/role-permissions';

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
