import * as bcrypt from 'bcryptjs';
import { Seeder } from './seeder';

export const UsersSeeder: Seeder = {
  name: 'UsersSeeder',
  async run(prisma) {
    // 1. Roles Check
    const adminRole = await prisma.role.findUnique({
      where: { code: 'SUPER_ADMIN' },
    });
    const doctorRole = await prisma.role.findUnique({
      where: { code: 'DOCTOR' },
    });
    if (!adminRole || !doctorRole) {
      throw new Error(
        'Required roles (SUPER_ADMIN, DOCTOR) are missing — run RolesSeeder first',
      );
    }

    const passwordHash = await bcrypt.hash('ChangeMe123!', 10);

    // 2. Seed Admin
    await prisma.user.upsert({
      where: { username: 'admin' },
      update: {
        employeeId: 'EMP-0000001',
        email: 'admin@example.com',
        fullName: 'System Administrator',
        passwordHash,
        roleId: adminRole.id,
        status: 'ACTIVE',
      },
      create: {
        employeeId: 'EMP-0000001',
        username: 'admin',
        email: 'admin@example.com',
        fullName: 'System Administrator',
        passwordHash,
        roleId: adminRole.id,
        status: 'ACTIVE',
      },
    });

    // 3. Seed Departments (Cardiology, General Medicine, Pediatrics, Orthopedics)
    const departmentsMeta = [
      { code: 'CARDIO', name: 'Cardiology' },
      { code: 'GEN_MED', name: 'General Medicine' },
      { code: 'PEDS', name: 'Pediatrics' },
      { code: 'ORTHO', name: 'Orthopedics' },
    ];

    const departmentMap = new Map<string, string>(); // code -> id
    for (const dept of departmentsMeta) {
      const dbDept = await prisma.department.upsert({
        where: { code: dept.code },
        update: { name: dept.name, isActive: true },
        create: { code: dept.code, name: dept.name, isActive: true },
      });
      departmentMap.set(dept.code, dbDept.id);
    }

    // 4. Seed Doctors
    const doctorsMeta = [
      {
        username: 'draungaung',
        email: 'draungaung@example.com',
        fullName: 'Dr. Aung Aung',
        employeeId: 'EMP-DOC001',
        deptCode: 'CARDIO',
      },
      {
        username: 'drhlahla',
        email: 'drhlahla@example.com',
        fullName: 'Dr. Hla Hla',
        employeeId: 'EMP-DOC002',
        deptCode: 'GEN_MED',
      },
      {
        username: 'drkyawmin',
        email: 'drkyawmin@example.com',
        fullName: 'Dr. Kyaw Min',
        employeeId: 'EMP-DOC003',
        deptCode: 'ORTHO',
      },
    ];

    const doctorMap = new Map<string, string>(); // username -> id
    for (const doc of doctorsMeta) {
      const deptId = departmentMap.get(doc.deptCode);
      const dbDoc = await prisma.user.upsert({
        where: { username: doc.username },
        update: {
          employeeId: doc.employeeId,
          email: doc.email,
          fullName: doc.fullName,
          passwordHash,
          roleId: doctorRole.id,
          departmentId: deptId,
          status: 'ACTIVE',
        },
        create: {
          username: doc.username,
          employeeId: doc.employeeId,
          email: doc.email,
          fullName: doc.fullName,
          passwordHash,
          roleId: doctorRole.id,
          departmentId: deptId,
          status: 'ACTIVE',
        },
      });
      doctorMap.set(doc.username, dbDoc.id);
    }

    // 5. Seed Patients
    const patientsMeta = [
      {
        mrn: 'MRN-0100043',
        firstName: 'Aung',
        lastName: 'Aung',
        bloodType: 'O_POS',
        primaryPhone: '091234567',
      },
      {
        mrn: 'MRN-0100044',
        firstName: 'Hla',
        lastName: 'Hla',
        bloodType: 'A_POS',
        primaryPhone: '091234568',
      },
      {
        mrn: 'MRN-0100045',
        firstName: 'Kyaw',
        lastName: 'Min',
        bloodType: 'B_POS',
        primaryPhone: '091234569',
      },
      {
        mrn: 'MRN-0100046',
        firstName: 'Su Su',
        lastName: 'Lwin',
        bloodType: 'AB_POS',
        primaryPhone: '091234570',
      },
      {
        mrn: 'MRN-0100047',
        firstName: 'Min',
        lastName: 'Thant',
        bloodType: 'O_NEG',
        primaryPhone: '091234571',
      },
    ];

    const systemAdminUser = await prisma.user.findUnique({
      where: { username: 'admin' },
    });
    if (!systemAdminUser) {
      throw new Error('Admin user not found');
    }

    for (const p of patientsMeta) {
      await prisma.patient.upsert({
        where: { mrn: p.mrn },
        update: {
          firstName: p.firstName,
          lastName: p.lastName,
          dateOfBirth: new Date('1990-01-01'),
          gender: 'MALE',
          primaryPhone: p.primaryPhone,
          registeredById: systemAdminUser.id,
        },
        create: {
          mrn: p.mrn,
          firstName: p.firstName,
          lastName: p.lastName,
          dateOfBirth: new Date('1990-01-01'),
          gender: 'MALE',
          primaryPhone: p.primaryPhone,
          registeredById: systemAdminUser.id,
        },
      });
    }

    // 6. Seed Doctor Schedules
    const aungAungId = doctorMap.get('draungaung');
    const hlaHlaId = doctorMap.get('drhlahla');

    // Clean up existing schedules for these seeded doctors
    if (aungAungId) {
      await prisma.doctorSchedule.deleteMany({
        where: { doctorId: aungAungId },
      });

      // Dr. Aung Aung: Monday (1) 09:00 - 12:00, Wednesday (3) 13:00 - 17:00
      await prisma.doctorSchedule.createMany({
        data: [
          {
            doctorId: aungAungId,
            dayOfWeek: 1,
            startTime: '09:00',
            endTime: '12:00',
            slotMinutes: 15,
            isActive: true,
            validFrom: new Date('2026-01-01'),
          },
          {
            doctorId: aungAungId,
            dayOfWeek: 3,
            startTime: '13:00',
            endTime: '17:00',
            slotMinutes: 15,
            isActive: true,
            validFrom: new Date('2026-01-01'),
          },
        ],
      });
    }

    if (hlaHlaId) {
      await prisma.doctorSchedule.deleteMany({ where: { doctorId: hlaHlaId } });

      // Dr. Hla Hla: Tuesday (2) 08:00 - 12:00
      await prisma.doctorSchedule.create({
        data: {
          doctorId: hlaHlaId,
          dayOfWeek: 2,
          startTime: '08:00',
          endTime: '12:00',
          slotMinutes: 20,
          isActive: true,
          validFrom: new Date('2026-01-01'),
        },
      });
    }

    console.log(
      'Successfully seeded roles, departments, doctors, patients, and schedules.',
    );
  },
};
