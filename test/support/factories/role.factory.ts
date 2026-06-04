import { faker } from '@faker-js/faker';
import type { Prisma, PrismaClient, Role } from '@prisma/client';

/**
 * Factory template. `build*` returns a valid input object (for unit tests);
 * `create*` persists it (for integration tests). Faker is seeded once in
 * test setup for determinism. Copy this shape for other entities.
 */
export function buildRole(
  overrides: Partial<Prisma.RoleCreateInput> = {},
): Prisma.RoleCreateInput {
  return {
    code: `ROLE_${faker.string.alphanumeric(8).toUpperCase()}`,
    name: faker.person.jobTitle(),
    description: faker.lorem.sentence(),
    ...overrides,
  };
}

export function createRole(
  prisma: PrismaClient,
  overrides: Partial<Prisma.RoleCreateInput> = {},
): Promise<Role> {
  return prisma.role.create({ data: buildRole(overrides) });
}
