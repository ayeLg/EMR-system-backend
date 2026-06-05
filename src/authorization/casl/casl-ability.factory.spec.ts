import { CaslAbilityFactory } from './casl-ability.factory';
import { Action } from './types';
import { PATIENT_SUBJECT } from './types/subjects';
import { Role } from '@/authorization/roles/role.enum';
import type { User } from '@/modules/users/entities/user.entity';
import { RbacService } from '@/authorization/rbac/rbac.service';

describe('CaslAbilityFactory', () => {
  const rbac = new RbacService({} as never);
  const factory = new CaslAbilityFactory(rbac);

  const buildUser = (role: Role, roleCode: string): User => ({
    id: 'user-id',
    email: `${role}@example.com`,
    fullName: role,
    role,
    roleCode,
    permissions: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  it('grants super_admin manage all', () => {
    const ability = factory.createForUser(
      buildUser(Role.SuperAdmin, 'SUPER_ADMIN'),
    );
    expect(ability.can(Action.Manage, 'all')).toBe(true);
  });

  it('grants doctor read and update on patients', () => {
    const ability = factory.createForUser(buildUser(Role.Doctor, 'DOCTOR'));
    expect(ability.can(Action.Read, PATIENT_SUBJECT)).toBe(true);
    expect(ability.can(Action.Update, PATIENT_SUBJECT)).toBe(true);
    expect(ability.can(Action.Delete, PATIENT_SUBJECT)).toBe(false);
  });

  it('grants receptionist create but not update on patients', () => {
    const ability = factory.createForUser(
      buildUser(Role.Receptionist, 'RECEPTIONIST'),
    );
    expect(ability.can(Action.Create, PATIENT_SUBJECT)).toBe(true);
    expect(ability.can(Action.Update, PATIENT_SUBJECT)).toBe(false);
  });
});
