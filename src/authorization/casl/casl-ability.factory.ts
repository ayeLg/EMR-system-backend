import { Injectable } from '@nestjs/common';
import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import { Action, AppAbility } from '@/authorization/casl/types';
import { Role } from '@/authorization/roles/role.enum';
import { RbacService } from '@/authorization/rbac/rbac.service';
import type { User } from '@/modules/users/entities/user.entity';
import { ROLE_PERMISSIONS } from '@/authorization/roles/role-permissions';

@Injectable()
export class CaslAbilityFactory {
  constructor(private readonly rbac: RbacService) {}

  createForUser(user: User): AppAbility {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
      createMongoAbility,
    );

    const rules =
      user.permissions.length > 0
        ? this.rbac.caslRulesFromPermissionKeys(user.permissions)
        : (ROLE_PERMISSIONS[user.role] ?? []);

    for (const rule of rules) {
      const apply = rule.inverted ? cannot : can;
      apply(rule.action, rule.subject);
    }

    if (user.role === Role.SuperAdmin || user.roleCode === 'SUPER_ADMIN') {
      can(Action.Manage, 'all');
    }

    return build();
  }
}
