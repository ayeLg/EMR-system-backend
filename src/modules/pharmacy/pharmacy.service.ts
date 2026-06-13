import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrescriptionStatus, Prisma } from '@prisma/client';
import { AuditService } from '@/modules/audit/audit.service';
import { PrismaService } from '@/prisma/prisma.service';
import { DispensePrescriptionDto } from './dto/dispense-prescription.dto';
import { InventoryResponseDto } from './dto/inventory-response.dto';
import {
  InteractionDto,
  PrescriptionResponseDto,
} from './dto/prescription-response.dto';
import {
  CreateInventoryDto,
  UpdateInventoryDto,
} from './dto/inventory-write.dto';

interface DBInteraction {
  targetCode: string;
  severity: 'CONTRAINDICATED' | 'SEVERE' | 'MODERATE' | 'MINOR';
  description: string;
}

@Injectable()
export class PharmacyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAllPrescriptions(): Promise<PrescriptionResponseDto[]> {
    const prescriptions = await this.prisma.prescription.findMany({
      include: {
        patient: { select: { firstName: true, lastName: true, mrn: true } },
        prescribedBy: { select: { fullName: true } },
        items: { include: { medication: true } },
      },
      orderBy: { prescribedAt: 'desc' },
    });

    const results: PrescriptionResponseDto[] = [];
    for (const rx of prescriptions) {
      // Find other active/dispensed medications for this patient in the last 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const activeMeds = await this.prisma.prescription.findMany({
        where: {
          patientId: rx.patientId,
          id: { not: rx.id },
          status: { in: ['DISPENSED', 'PARTIALLY_DISPENSED'] },
          dispensedAt: { gte: ninetyDaysAgo },
        },
        include: { items: { include: { medication: true } } },
      });

      const otherMedications = activeMeds.flatMap((p) =>
        p.items.map((i) => i.medication),
      );
      const currentMedications = rx.items.map((i) => i.medication);

      const interactions = this.checkInteractions(
        currentMedications,
        otherMedications,
      );

      results.push({
        id: rx.id,
        rxNumber: rx.rxNumber,
        patientName: `${rx.patient.firstName} ${rx.patient.lastName}`,
        mrn: rx.patient.mrn,
        prescribedBy: rx.prescribedBy.fullName,
        prescribedAt: rx.prescribedAt.toISOString(),
        status: rx.status,
        priority: 'ROUTINE',
        items: rx.items.map((item) => ({
          medication: item.medication.genericName,
          dose: item.dose,
          route: item.route,
          frequency: item.frequency,
          quantityPrescribed: item.quantityPrescribed,
          quantityDispensed: item.quantityDispensed ?? undefined,
        })),
        interactions,
      });
    }

    return results;
  }

  async findAllInventory(): Promise<InventoryResponseDto[]> {
    const inventory = await this.prisma.drugInventory.findMany({
      include: { medication: true },
      orderBy: [{ medication: { genericName: 'asc' } }, { expiryDate: 'asc' }],
    });

    return inventory.map((item) => ({
      id: item.id,
      name: `${item.medication.genericName} ${item.medication.strength}`,
      batchNumber: item.batchNumber,
      expiryDate: item.expiryDate.toISOString().split('T')[0],
      quantityOnHand: item.quantityOnHand,
      reorderLevel: item.reorderLevel,
    }));
  }

  async createInventory(
    dto: CreateInventoryDto,
    userId: string,
  ): Promise<InventoryResponseDto> {
    const medication = await this.prisma.medication.findUnique({
      where: { id: dto.medicationId },
    });
    if (!medication) {
      throw new NotFoundException(`Medication ${dto.medicationId} not found`);
    }

    const item = await this.prisma.drugInventory.create({
      data: {
        medicationId: dto.medicationId,
        batchNumber: dto.batchNumber,
        expiryDate: new Date(dto.expiryDate),
        quantityOnHand: dto.quantityOnHand,
        reorderLevel: dto.reorderLevel ?? 50,
        unitCost: new Prisma.Decimal(dto.unitCost),
        supplier: dto.supplier,
      },
      include: { medication: true },
    });

    await this.auditService.create({
      userId,
      action: 'CREATE_INVENTORY',
      module: 'PHARMACY',
      resourceId: item.id,
      newData: item,
    });

    return {
      id: item.id,
      name: `${item.medication.genericName} ${item.medication.strength}`,
      batchNumber: item.batchNumber,
      expiryDate: item.expiryDate.toISOString().split('T')[0],
      quantityOnHand: item.quantityOnHand,
      reorderLevel: item.reorderLevel,
    };
  }

  async updateInventory(
    id: string,
    dto: UpdateInventoryDto,
    userId: string,
  ): Promise<InventoryResponseDto> {
    const existing = await this.prisma.drugInventory.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Inventory item ${id} not found`);
    }

    const item = await this.prisma.drugInventory.update({
      where: { id },
      data: {
        batchNumber: dto.batchNumber,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        quantityOnHand: dto.quantityOnHand,
        reorderLevel: dto.reorderLevel,
        unitCost: dto.unitCost ? new Prisma.Decimal(dto.unitCost) : undefined,
        supplier: dto.supplier,
      },
      include: { medication: true },
    });

    await this.auditService.create({
      userId,
      action: 'UPDATE_INVENTORY',
      module: 'PHARMACY',
      resourceId: id,
      oldData: existing,
      newData: item,
    });

    return {
      id: item.id,
      name: `${item.medication.genericName} ${item.medication.strength}`,
      batchNumber: item.batchNumber,
      expiryDate: item.expiryDate.toISOString().split('T')[0],
      quantityOnHand: item.quantityOnHand,
      reorderLevel: item.reorderLevel,
    };
  }

  async deleteInventory(
    id: string,
    userId: string,
  ): Promise<{ deleted: boolean }> {
    const existing = await this.prisma.drugInventory.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Inventory item ${id} not found`);
    }

    await this.prisma.drugInventory.delete({ where: { id } });

    await this.auditService.create({
      userId,
      action: 'DELETE_INVENTORY',
      module: 'PHARMACY',
      resourceId: id,
      oldData: existing,
    });

    return { deleted: true };
  }

  async dispensePrescription(
    id: string,
    dto: DispensePrescriptionDto,
    userId: string,
  ): Promise<PrescriptionResponseDto> {
    return this.prisma.$transaction(async (tx) => {
      const rx = await tx.prescription.findUnique({
        where: { id },
        include: {
          patient: { select: { firstName: true, lastName: true, mrn: true } },
          prescribedBy: { select: { fullName: true } },
          items: { include: { medication: true } },
        },
      });

      if (!rx) {
        throw new NotFoundException(`Prescription ${id} not found`);
      }

      if (rx.status !== 'PENDING' && rx.status !== 'PARTIALLY_DISPENSED') {
        throw new BadRequestException(
          `Prescription is in status ${rx.status} and cannot be dispensed.`,
        );
      }

      // Check interactions
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const activeMeds = await tx.prescription.findMany({
        where: {
          patientId: rx.patientId,
          id: { not: rx.id },
          status: { in: ['DISPENSED', 'PARTIALLY_DISPENSED'] },
          dispensedAt: { gte: ninetyDaysAgo },
        },
        include: { items: { include: { medication: true } } },
      });

      const otherMedications = activeMeds.flatMap((p) =>
        p.items.map((i) => i.medication),
      );
      const currentMedications = rx.items.map((i) => i.medication);
      const interactions = this.checkInteractions(
        currentMedications,
        otherMedications,
      );

      // Enforce interaction gates
      const contraindicated = interactions.filter(
        (i) => i.severity === 'CONTRAINDICATED',
      );
      if (contraindicated.length > 0) {
        throw new BadRequestException(
          `Dispensing BLOCKED: Contraindicated drug interaction detected (${contraindicated.map((c) => c.drugs).join(', ')}).`,
        );
      }

      const severe = interactions.filter((i) => i.severity === 'SEVERE');
      if (severe.length > 0 && !dto.coSignObtained) {
        throw new BadRequestException(
          `Dispensing BLOCKED: Severe drug interaction detected (${severe.map((s) => s.drugs).join(', ')}). Consultant co-sign required.`,
        );
      }

      const moderate = interactions.filter((i) => i.severity === 'MODERATE');
      if (moderate.length > 0 && !dto.ackModerate) {
        throw new BadRequestException(
          `Dispensing BLOCKED: Moderate drug interaction detected (${moderate.map((m) => m.drugs).join(', ')}). Acknowledgement required.`,
        );
      }

      let anyDispensed = false;
      let allFullyDispensed = true;

      // Deduct stock FIFO
      for (const item of rx.items) {
        const qtyPrescribed = item.quantityPrescribed;
        const qtyDispensed = item.quantityDispensed ?? 0;
        let qtyNeeded = qtyPrescribed - qtyDispensed;

        if (qtyNeeded <= 0) {
          continue; // Already fully dispensed
        }

        // Find available batches sorted by expiryDate ASC (FIFO)
        const batches = await tx.drugInventory.findMany({
          where: {
            medicationId: item.medicationId,
            quantityOnHand: { gt: 0 },
            expiryDate: { gt: new Date() },
          },
          orderBy: { expiryDate: 'asc' },
        });

        let dispensedInThisRun = 0;
        for (const batch of batches) {
          if (qtyNeeded <= 0) break;
          const take = Math.min(qtyNeeded, batch.quantityOnHand);
          if (take > 0) {
            const updatedBatch = await tx.drugInventory.update({
              where: { id: batch.id },
              data: { quantityOnHand: { decrement: take } },
            });

            // Send low stock alert if needed
            if (updatedBatch.quantityOnHand <= updatedBatch.reorderLevel) {
              await tx.notification.create({
                data: {
                  userId,
                  type: 'SYSTEM_ALERT',
                  title: 'Low Stock Alert',
                  body: `Medication "${item.medication.genericName}" batch "${batch.batchNumber}" has fallen below reorder level (Qty: ${updatedBatch.quantityOnHand}/${updatedBatch.reorderLevel}).`,
                  refType: 'MEDICATION',
                  refId: item.medicationId,
                },
              });
            }

            qtyNeeded -= take;
            dispensedInThisRun += take;
          }
        }

        const newQtyDispensed = qtyDispensed + dispensedInThisRun;
        await tx.prescriptionItem.update({
          where: { id: item.id },
          data: { quantityDispensed: newQtyDispensed },
        });

        if (newQtyDispensed > 0) {
          anyDispensed = true;
        }

        if (newQtyDispensed < qtyPrescribed) {
          allFullyDispensed = false;
        }
      }

      // If no inventory was actually deducted but some was needed, fail or allow partial 0
      if (
        !anyDispensed &&
        rx.items.some((i) => i.quantityPrescribed > (i.quantityDispensed ?? 0))
      ) {
        throw new BadRequestException(
          'Dispensing failed: No available stock in inventory for prescribed items.',
        );
      }

      let finalStatus: PrescriptionStatus = rx.status;
      if (allFullyDispensed) {
        finalStatus = 'DISPENSED';
      } else if (anyDispensed) {
        finalStatus = 'PARTIALLY_DISPENSED';
      }

      const updatedRx = await tx.prescription.update({
        where: { id },
        data: {
          status: finalStatus,
          dispensedAt: new Date(),
          dispensedById: userId,
          notes: dto.overrideReason
            ? `${rx.notes || ''}\nPharmacist override reason: ${dto.overrideReason}`.trim()
            : rx.notes,
        },
        include: {
          patient: { select: { firstName: true, lastName: true, mrn: true } },
          prescribedBy: { select: { fullName: true } },
          items: { include: { medication: true } },
        },
      });

      // Write Audit Log
      await this.auditService.create({
        userId,
        action: `DISPENSE_PRESCRIPTION_${finalStatus}`,
        module: 'PHARMACY',
        resourceId: id,
        oldData: { status: rx.status },
        newData: {
          status: updatedRx.status,
          overrides: {
            coSignObtained: dto.coSignObtained,
            ackModerate: dto.ackModerate,
            overrideReason: dto.overrideReason,
          },
        },
      });

      return {
        id: updatedRx.id,
        rxNumber: updatedRx.rxNumber,
        patientName: `${updatedRx.patient.firstName} ${updatedRx.patient.lastName}`,
        mrn: updatedRx.patient.mrn,
        prescribedBy: updatedRx.prescribedBy.fullName,
        prescribedAt: updatedRx.prescribedAt.toISOString(),
        status: updatedRx.status,
        priority: 'ROUTINE',
        items: updatedRx.items.map((item) => ({
          medication: item.medication.genericName,
          dose: item.dose,
          route: item.route,
          frequency: item.frequency,
          quantityPrescribed: item.quantityPrescribed,
          quantityDispensed: item.quantityDispensed ?? undefined,
        })),
        interactions,
      };
    });
  }

  private checkInteractions(
    currentMeds: Array<{
      code: string;
      genericName: string;
      interactions: any;
    }>,
    otherMeds: Array<{ code: string; genericName: string; interactions: any }>,
  ): InteractionDto[] {
    const interactions: InteractionDto[] = [];
    const seen = new Set<string>();

    // Check interaction pairs
    for (let i = 0; i < currentMeds.length; i += 1) {
      const medA = currentMeds[i];

      // Compare with other medications in the same prescription
      for (let j = i + 1; j < currentMeds.length; j += 1) {
        const medB = currentMeds[j];
        this.evaluateMedicationPair(medA, medB, interactions, seen);
      }

      // Compare with patient's existing active medications
      for (const medB of otherMeds) {
        this.evaluateMedicationPair(medA, medB, interactions, seen);
      }
    }

    return interactions;
  }

  private evaluateMedicationPair(
    medA: { code: string; genericName: string; interactions: any },
    medB: { code: string; genericName: string; interactions: any },
    interactions: InteractionDto[],
    seen: Set<string>,
  ) {
    if (medA.code === medB.code) return;

    const pairKey = [medA.code, medB.code]
      .sort((a, b) => a.localeCompare(b))
      .join(' + ');
    if (seen.has(pairKey)) return;

    // Check rules in MedA pointing to MedB
    const rulesA = (medA.interactions as unknown as DBInteraction[]) || [];
    const ruleA = rulesA.find((r) => r.targetCode === medB.code);

    if (ruleA) {
      seen.add(pairKey);
      interactions.push({
        drugs: `${medA.genericName} + ${medB.genericName}`,
        severity: ruleA.severity,
        description: ruleA.description,
      });
      return;
    }

    // Check rules in MedB pointing to MedA
    const rulesB = (medB.interactions as unknown as DBInteraction[]) || [];
    const ruleB = rulesB.find((r) => r.targetCode === medA.code);

    if (ruleB) {
      seen.add(pairKey);
      interactions.push({
        drugs: `${medB.genericName} + ${medA.genericName}`,
        severity: ruleB.severity,
        description: ruleB.description,
      });
    }
  }
}
