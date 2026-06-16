import { NotFoundException } from '@nestjs/common';
import { PatientsService } from './patients.service';
import type { CreatePatientDto } from './dto/create-patient.dto';
import type { PrismaService } from '@/prisma/prisma.service';
import type { CryptoService } from '@/common/security/crypto.service';

describe('PatientsService (unit)', () => {
  let service: PatientsService;
  let prisma: {
    patient: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    $queryRaw: jest.Mock;
  };

  const now = new Date('2026-06-05T00:00:00.000Z');
  const patientRow = {
    id: 'p1',
    mrn: 'MRN-0100043',
    firstName: 'Aung',
    lastName: 'Min',
    dateOfBirth: new Date('1990-01-01T00:00:00.000Z'),
    gender: 'MALE',
    nrcNumber: null,
    bloodType: 'UNKNOWN',
    photoUrl: null,
    primaryPhone: '09123456789',
    secondaryPhone: null,
    email: null,
    address: null,
    city: null,
    township: null,
    isActive: true,
    registeredById: 'user-1',
    createdAt: now,
    updatedAt: now,
  };

  beforeEach(() => {
    prisma = {
      patient: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $queryRaw: jest.fn(),
    };
    const crypto = {
      encrypt: (v: string) => v,
      decrypt: (v: string) => v,
      safeDecrypt: (v: string | null) => v,
      blindIndex: (v: string) => `hash:${v}`,
    };
    service = new PatientsService(
      prisma as unknown as PrismaService,
      crypto as unknown as CryptoService,
    );
  });

  const validDto = (): CreatePatientDto => ({
    firstName: 'Aung',
    lastName: 'Min',
    dateOfBirth: '1990-01-01',
    gender: 'MALE',
    primaryPhone: '09123456789',
  });

  it('throws NotFoundException for an unknown id', async () => {
    prisma.patient.findUnique.mockResolvedValue(null);

    await expect(service.findOne('does-not-exist')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('findAll() returns active patients mapped for the API', async () => {
    prisma.patient.findMany.mockResolvedValue([patientRow]);

    const patients = await service.findAll();

    expect(patients).toEqual([
      expect.objectContaining({
        id: 'p1',
        dateOfBirth: '1990-01-01',
        gender: 'MALE',
        bloodType: 'UNKNOWN',
        primaryPhone: '09123456789',
        isActive: true,
      }),
    ]);
    expect(prisma.patient.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('findOne() maps allergies and recent encounters into the detail shape', async () => {
    prisma.patient.findUnique.mockResolvedValue({
      ...patientRow,
      allergies: [
        {
          id: 'a1',
          allergenType: 'DRUG',
          allergenName: 'Penicillin',
          severity: 'SEVERE',
          reaction: 'Anaphylaxis',
        },
      ],
      encounters: [
        {
          id: 'e1',
          encounterNo: 'ENC-0200102',
          encounterType: 'OPD',
          status: 'COMPLETED',
          startTime: new Date('2026-05-20T08:00:00.000Z'),
          attendingDoctor: { fullName: 'Dr. Hla Hla' },
        },
      ],
    });

    const detail = await service.findOne('p1');

    expect(detail.allergies).toEqual([
      expect.objectContaining({
        allergenName: 'Penicillin',
        severity: 'SEVERE',
      }),
    ]);
    expect(detail.recentEncounters).toEqual([
      expect.objectContaining({
        encounterNo: 'ENC-0200102',
        date: '2026-05-20',
        type: 'OPD',
        doctor: 'Dr. Hla Hla',
        status: 'COMPLETED',
      }),
    ]);
  });

  it('create() auto-generates a 7-digit MRN and stores registeredById', async () => {
    prisma.$queryRaw.mockResolvedValue([{ nextval: 43n }]);
    prisma.patient.create.mockResolvedValue(patientRow);
    prisma.patient.findMany.mockResolvedValue([]); // no duplicate candidates

    const created = await service.create(validDto(), 'user-1');

    expect(created.id).toBe('p1');
    expect(prisma.patient.create).toHaveBeenCalledWith({
      data: {
        ...validDto(),
        mrn: 'MRN-0000043',
        dateOfBirth: new Date('1990-01-01'),
        registeredById: 'user-1',
      },
    });
  });

  it('update() changes fields and bumps updatedAt', async () => {
    prisma.patient.findUnique.mockResolvedValue({ id: 'p1' });
    prisma.patient.update.mockResolvedValue({
      ...patientRow,
      lastName: 'Khaing',
      updatedAt: new Date('2026-06-05T00:00:01.000Z'),
    });

    const updated = await service.update('p1', { lastName: 'Khaing' });

    expect(updated.lastName).toBe('Khaing');
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
      patientRow.updatedAt.getTime(),
    );
  });

  it('update() throws NotFoundException for an unknown id', async () => {
    prisma.patient.findUnique.mockResolvedValue(null);

    await expect(
      service.update('does-not-exist', { lastName: 'X' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('remove() soft deletes an existing patient', async () => {
    prisma.patient.findUnique.mockResolvedValue({ id: 'p1' });
    prisma.patient.update.mockResolvedValue({
      ...patientRow,
      isActive: false,
    });

    await service.remove('p1');

    expect(prisma.patient.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { isActive: false },
    });
  });

  it('remove() throws NotFoundException for an unknown id', async () => {
    prisma.patient.findUnique.mockResolvedValue(null);

    await expect(service.remove('does-not-exist')).rejects.toThrow(
      NotFoundException,
    );
  });
});
