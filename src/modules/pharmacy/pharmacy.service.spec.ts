import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PharmacyService } from './pharmacy.service';
import type { PrismaService } from '@/prisma/prisma.service';
import type { AuditService } from '@/modules/audit/audit.service';
import type { CryptoService } from '@/common/security/crypto.service';

describe('PharmacyService (unit)', () => {
  let service: PharmacyService;
  let prisma: {
    prescription: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    drugInventory: {
      findMany: jest.Mock;
      update: jest.Mock;
    };
    prescriptionItem: {
      update: jest.Mock;
    };
    notification: {
      create: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let auditService: {
    create: jest.Mock;
  };

  const mockMedications = {
    med1: {
      id: 'm1',
      code: 'MED-WARF',
      genericName: 'Warfarin',
      interactions: [
        {
          targetCode: 'MED-ASPI',
          severity: 'SEVERE',
          description: 'Bleeding risk.',
        },
      ],
    },
    med2: {
      id: 'm2',
      code: 'MED-ASPI',
      genericName: 'Aspirin',
      interactions: [
        {
          targetCode: 'MED-WARF',
          severity: 'SEVERE',
          description: 'Bleeding risk.',
        },
      ],
    },
    med3: {
      id: 'm3',
      code: 'MED-PARA',
      genericName: 'Paracetamol',
      interactions: [],
    },
    med4: {
      id: 'm4',
      code: 'MED-GEMF',
      genericName: 'Gemfibrozil',
      interactions: [
        {
          targetCode: 'MED-SIMV',
          severity: 'CONTRAINDICATED',
          description: 'Myopathy risk.',
        },
      ],
    },
    med5: {
      id: 'm5',
      code: 'MED-SIMV',
      genericName: 'Simvastatin',
      interactions: [
        {
          targetCode: 'MED-GEMF',
          severity: 'CONTRAINDICATED',
          description: 'Myopathy risk.',
        },
      ],
    },
  };

  beforeEach(() => {
    prisma = {
      prescription: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      drugInventory: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
      prescriptionItem: {
        update: jest.fn(),
      },
      notification: {
        create: jest.fn(),
      },
      $transaction: jest.fn((cb: (tx: any) => unknown) => cb(prisma)),
    };

    auditService = {
      create: jest.fn(),
    };

    const crypto = {
      encrypt: (v: string) => v,
      decrypt: (v: string) => v,
      safeDecrypt: (v: string | null) => v,
      blindIndex: (v: string) => `hash:${v}`,
    };
    service = new PharmacyService(
      prisma as unknown as PrismaService,
      auditService as unknown as AuditService,
      crypto as unknown as CryptoService,
    );
  });

  describe('findAllPrescriptions', () => {
    it('returns prescriptions with mapped details and active interactions', async () => {
      const mockRx = {
        id: 'rx-1',
        rxNumber: 'RX-0000001',
        patientId: 'pat-1',
        status: 'PENDING',
        prescribedAt: new Date('2026-06-01T08:00:00.000Z'),
        patient: { firstName: 'Aung', lastName: 'Aung', mrn: 'MRN-01' },
        prescribedBy: { fullName: 'Dr. Khin' },
        items: [
          {
            medicationId: 'm1',
            dose: '5mg',
            route: 'ORAL',
            frequency: 'OD',
            quantityPrescribed: 30,
            medication: mockMedications.med1,
          },
          {
            medicationId: 'm2',
            dose: '100mg',
            route: 'ORAL',
            frequency: 'OD',
            quantityPrescribed: 30,
            medication: mockMedications.med2,
          },
        ],
      };

      prisma.prescription.findMany
        .mockResolvedValueOnce([mockRx]) // findAllPrescriptions list query
        .mockResolvedValueOnce([]); // activeMeds (90 days) query

      const result = await service.findAllPrescriptions();

      expect(result).toHaveLength(1);
      expect(result[0].rxNumber).toBe('RX-0000001');
      expect(result[0].patientName).toBe('Aung Aung');
      expect(result[0].interactions).toHaveLength(1);
      expect(result[0].interactions[0].severity).toBe('SEVERE');
      expect(result[0].interactions[0].drugs).toContain('Warfarin');
      expect(result[0].interactions[0].drugs).toContain('Aspirin');
    });
  });

  describe('findAllInventory', () => {
    it('returns mapped inventory items', async () => {
      const mockInv = {
        id: 'inv-1',
        batchNumber: 'B-1',
        expiryDate: new Date('2027-01-01T00:00:00.000Z'),
        quantityOnHand: 500,
        reorderLevel: 100,
        medication: {
          genericName: 'Paracetamol',
          strength: '500mg',
        },
      };

      prisma.drugInventory.findMany.mockResolvedValue([mockInv]);

      const result = await service.findAllInventory();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Paracetamol 500mg');
      expect(result[0].batchNumber).toBe('B-1');
      expect(result[0].expiryDate).toBe('2027-01-01');
      expect(result[0].quantityOnHand).toBe(500);
    });
  });

  describe('dispensePrescription', () => {
    it('throws NotFoundException if prescription does not exist', async () => {
      prisma.prescription.findUnique.mockResolvedValue(null);

      await expect(
        service.dispensePrescription('unknown-id', {}, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException if prescription is already DISPENSED', async () => {
      prisma.prescription.findUnique.mockResolvedValue({ status: 'DISPENSED' });

      await expect(
        service.dispensePrescription('rx-id', {}, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for CONTRAINDICATED drug interactions', async () => {
      const mockRx = {
        id: 'rx-2',
        patientId: 'pat-1',
        status: 'PENDING',
        items: [
          { medicationId: 'm4', medication: mockMedications.med4 },
          { medicationId: 'm5', medication: mockMedications.med5 },
        ],
      };

      prisma.prescription.findUnique.mockResolvedValue(mockRx);
      prisma.prescription.findMany.mockResolvedValue([]); // No active meds

      await expect(
        service.dispensePrescription('rx-2', {}, 'user-1'),
      ).rejects.toThrow(/Contraindicated drug interaction detected/);
    });

    it('throws BadRequestException for SEVERE interactions if coSignObtained is false', async () => {
      const mockRx = {
        id: 'rx-3',
        patientId: 'pat-1',
        status: 'PENDING',
        items: [
          { medicationId: 'm1', medication: mockMedications.med1 },
          { medicationId: 'm2', medication: mockMedications.med2 },
        ],
      };

      prisma.prescription.findUnique.mockResolvedValue(mockRx);
      prisma.prescription.findMany.mockResolvedValue([]);

      await expect(
        service.dispensePrescription('rx-3', {}, 'user-1'),
      ).rejects.toThrow(/Severe drug interaction detected.*co-sign required/);
    });

    it('deducts inventory FIFO style and completes prescription status', async () => {
      const mockRx = {
        id: 'rx-4',
        rxNumber: 'RX-04',
        patientId: 'pat-1',
        status: 'PENDING',
        prescribedAt: new Date('2026-06-01T08:00:00.000Z'),
        patient: { firstName: 'Aung', lastName: 'Aung', mrn: 'MRN-01' },
        prescribedBy: { fullName: 'Dr. Khin' },
        items: [
          {
            id: 'item-1',
            medicationId: 'm3',
            quantityPrescribed: 60,
            quantityDispensed: 0,
            medication: mockMedications.med3,
          },
        ],
      };

      const mockBatches = [
        { id: 'b1', batchNumber: 'B1', quantityOnHand: 20, reorderLevel: 10 },
        { id: 'b2', batchNumber: 'B2', quantityOnHand: 100, reorderLevel: 10 },
      ];

      prisma.prescription.findUnique.mockResolvedValue(mockRx);
      prisma.prescription.findMany.mockResolvedValue([]);
      prisma.drugInventory.findMany.mockResolvedValue(mockBatches);

      // Setup update mocks to return updated values
      prisma.drugInventory.update
        .mockResolvedValueOnce({
          id: 'b1',
          quantityOnHand: 0,
          reorderLevel: 10,
        }) // b1 fully depleted
        .mockResolvedValueOnce({
          id: 'b2',
          quantityOnHand: 60,
          reorderLevel: 10,
        }); // b2 takes 40 remaining

      prisma.prescription.update.mockResolvedValue({
        ...mockRx,
        status: 'DISPENSED',
        items: [
          {
            ...mockRx.items[0],
            quantityDispensed: 60,
          },
        ],
      });

      const result = await service.dispensePrescription(
        'rx-4',
        { coSignObtained: true },
        'user-1',
      );

      expect(result.status).toBe('DISPENSED');
      expect(prisma.drugInventory.update).toHaveBeenCalledTimes(2);
      expect(prisma.drugInventory.update).toHaveBeenNthCalledWith(1, {
        where: { id: 'b1' },
        data: { quantityOnHand: { decrement: 20 } },
      });
      expect(prisma.drugInventory.update).toHaveBeenNthCalledWith(2, {
        where: { id: 'b2' },
        data: { quantityOnHand: { decrement: 40 } },
      });
      expect(prisma.prescriptionItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { quantityDispensed: 60 },
      });
    });
  });
});
