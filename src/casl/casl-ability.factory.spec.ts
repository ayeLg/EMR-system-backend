import { CaslAbilityFactory } from './casl-ability.factory';
import { Action } from './types';
import { Role } from '@/roles/role.enum';
import { Patient } from '@/patients/entities/patient.entity';
import { User } from '@/users/entities/user.entity';

describe('CaslAbilityFactory', () => {
  const factory = new CaslAbilityFactory();

  it('grants super_admin manage all', () => {
    const ability = factory.createForUser(
      new User({ id: '1', role: Role.SuperAdmin } as User),
    );
    expect(ability.can(Action.Manage, 'all')).toBe(true);
  });

  it('grants doctor read and update on patients', () => {
    const ability = factory.createForUser(
      new User({ id: '2', role: Role.Doctor } as User),
    );
    expect(ability.can(Action.Read, Patient)).toBe(true);
    expect(ability.can(Action.Update, Patient)).toBe(true);
    expect(ability.can(Action.Delete, Patient)).toBe(false);
  });

  it('grants receptionist create but not update on patients', () => {
    const ability = factory.createForUser(
      new User({ id: '4', role: Role.Receptionist } as User),
    );
    expect(ability.can(Action.Create, Patient)).toBe(true);
    expect(ability.can(Action.Update, Patient)).toBe(false);
  });
});
