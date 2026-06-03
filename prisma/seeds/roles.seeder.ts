import { Seeder } from './seeder';

/** The 8 RBAC roles from CLAUDE.md. Idempotent via upsert on the unique code. */
const ROLES: ReadonlyArray<{
  code: string;
  name: string;
  description: string;
}> = [
  {
    code: 'SUPER_ADMIN',
    name: 'Super Admin',
    description: 'Hospital IT admin — full system access',
  },
  {
    code: 'DOCTOR',
    name: 'Doctor',
    description: 'Physician — clinical full access (own patients)',
  },
  { code: 'NURSE', name: 'Nurse', description: 'Ward-level clinical access' },
  {
    code: 'RECEPTIONIST',
    name: 'Receptionist',
    description: 'Front desk — registration + appointments',
  },
  { code: 'PHARMACIST', name: 'Pharmacist', description: 'Pharmacy module' },
  {
    code: 'LAB_TECH',
    name: 'Lab Technician',
    description: 'Laboratory module',
  },
  {
    code: 'BILLING_STAFF',
    name: 'Billing Staff',
    description: 'Billing module',
  },
  {
    code: 'PATIENT',
    name: 'Patient',
    description: 'Patient portal — read-only own records',
  },
];

export const RolesSeeder: Seeder = {
  name: 'RolesSeeder',
  async run(prisma) {
    for (const role of ROLES) {
      await prisma.role.upsert({
        where: { code: role.code },
        update: { name: role.name, description: role.description },
        create: role,
      });
    }
  },
};
