import { faker } from '@faker-js/faker';
import type { PrismaClient } from '@prisma/client';
import { getTestPrisma } from '../support/prisma-test-client';
import { resetDb } from '../support/reset-db';
import { buildRole, createRole } from '../support/factories/role.factory';

describe('Integration harness (int)', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    faker.seed(12345); // deterministic test data
    prisma = getTestPrisma();
  });

  beforeEach(async () => {
    await resetDb(prisma);
  });

  it('persists and reads back a row (Testcontainers + Prisma work)', async () => {
    const created = await createRole(prisma, { code: 'TEST_ROLE_A' });

    const found = await prisma.role.findUnique({ where: { id: created.id } });

    expect(found).not.toBeNull();
    expect(found?.code).toBe('TEST_ROLE_A');
  });

  it('enforces the unique constraint on role.code', async () => {
    await createRole(prisma, { code: 'DUP_CODE' });

    await expect(createRole(prisma, { code: 'DUP_CODE' })).rejects.toThrow();
  });

  it('rolls back a failed transaction, leaving no partial data', async () => {
    await expect(
      prisma.$transaction(async (tx) => {
        await tx.role.create({ data: buildRole({ code: 'TX_OK' }) });
        // Second insert violates the unique constraint -> whole tx aborts.
        await tx.role.create({ data: buildRole({ code: 'TX_OK' }) });
      }),
    ).rejects.toThrow();

    const count = await prisma.role.count({ where: { code: 'TX_OK' } });
    expect(count).toBe(0);
  });
});
