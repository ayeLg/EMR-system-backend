import { CaslAbilityFactory } from './casl-ability.factory';
import { Action } from './types';
import { Subjects } from './types/subjects';
import { Role } from '@/roles/role.enum';
import type { User } from '@/users/entities/user.entity';

describe('CaslAbilityFactory', () => {
  const factory = new CaslAbilityFactory();
  const buildUser = (role: Role): User => ({
    id: 'user-id',
    email: `${role}@example.com`,
    fullName: role,
    role,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  it('grants super_admin manage all', () => {
    const ability = factory.createForUser(buildUser(Role.SuperAdmin));
    expect(ability.can(Action.Manage, 'all')).toBe(true);
  });

  it('grants doctor read and update on patients', () => {
    const ability = factory.createForUser(buildUser(Role.Doctor));
    expect(ability.can(Action.Read, Subjects.Patient)).toBe(true);
    expect(ability.can(Action.Update, Subjects.Patient)).toBe(true);
    expect(ability.can(Action.Delete, Subjects.Patient)).toBe(false);
  });

  it('grants receptionist create but not update on patients', () => {
    const ability = factory.createForUser(buildUser(Role.Receptionist));
    expect(ability.can(Action.Create, Subjects.Patient)).toBe(true);
    expect(ability.can(Action.Update, Subjects.Patient)).toBe(false);
  });
});
