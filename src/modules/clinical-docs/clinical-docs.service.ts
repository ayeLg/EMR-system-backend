import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import {
  CreateClinicalDocDto,
  RecordMarAdministerDto,
} from './dto/clinical-docs.dto';

interface MarLogContent {
  prescriptionItemId?: string;
  slot?: string;
  adminDate?: string;
  medicationName?: string;
  adminTimestamp?: string;
}

@Injectable()
export class ClinicalDocsService {
  constructor(private readonly prisma: PrismaService) {}

  async createClinicalDoc(dto: CreateClinicalDocDto, authorId: string) {
    return this.prisma.clinicalNote.create({
      data: {
        encounterId: dto.encounterId,
        authorId,
        noteType: dto.noteType,
        content: JSON.stringify(dto.content),
      },
    });
  }

  async getClinicalDocsByPatient(patientId: string) {
    return this.prisma.clinicalNote.findMany({
      where: {
        encounter: { patientId },
        noteType: { in: ['REFERRAL', 'CERTIFICATE', 'DISCHARGE'] },
      },
      include: {
        encounter: {
          select: {
            encounterNo: true,
            startTime: true,
            encounterType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMarDetailsByPatient(patientId: string, dateStr: string) {
    // Find patient's latest open encounter
    const activeEncounter = await this.prisma.encounter.findFirst({
      where: {
        patientId,
        status: 'OPEN',
      },
      orderBy: { startTime: 'desc' },
    });

    if (!activeEncounter) {
      return [];
    }

    return this.getMarDetails(activeEncounter.id, dateStr);
  }

  async getMarDetails(encounterId: string, dateStr: string) {
    // 1. Get all prescriptions for this encounter
    const prescriptions = await this.prisma.prescription.findMany({
      where: { encounterId },
      include: {
        items: {
          include: {
            medication: true,
          },
        },
      },
    });

    const items = prescriptions.flatMap((p) => p.items);

    // 2. Get all MAR logs for this encounter
    const marLogs = await this.prisma.clinicalNote.findMany({
      where: {
        encounterId,
        noteType: 'MAR',
      },
    });

    // 3. Map items to include their given state for the given dateStr
    return items.map((item) => {
      const given: Record<string, boolean> = {};
      for (const slot of ['08:00', '14:00', '20:00'] as const) {
        const log = marLogs.find((l) => {
          try {
            const parsed = JSON.parse(l.content || '{}') as MarLogContent;
            return (
              parsed.prescriptionItemId === item.id &&
              parsed.slot === slot &&
              parsed.adminDate === dateStr
            );
          } catch {
            return false;
          }
        });
        given[slot] = !!log;
      }

      return {
        id: item.id,
        prescriptionId: item.prescriptionId,
        medicationId: item.medicationId,
        medication: item.medication.brandName || item.medication.genericName,
        dose: item.dose,
        route: item.route,
        frequency: item.frequency,
        durationDays: item.durationDays,
        given,
      };
    });
  }

  async administerMedication(dto: RecordMarAdministerDto, authorId: string) {
    // Verify duplicate administration
    const logs = await this.prisma.clinicalNote.findMany({
      where: {
        encounterId: dto.encounterId,
        noteType: 'MAR',
      },
    });

    const duplicate = logs.some((l) => {
      try {
        const parsed = JSON.parse(l.content || '{}') as MarLogContent;
        return (
          parsed.prescriptionItemId === dto.prescriptionItemId &&
          parsed.slot === dto.slot &&
          parsed.adminDate === dto.adminDate
        );
      } catch {
        return false;
      }
    });

    if (duplicate) {
      throw new BadRequestException(
        'Medication has already been administered for this slot today',
      );
    }

    return this.prisma.clinicalNote.create({
      data: {
        encounterId: dto.encounterId,
        authorId,
        noteType: 'MAR',
        content: JSON.stringify({
          prescriptionItemId: dto.prescriptionItemId,
          medicationName: dto.medicationName,
          slot: dto.slot,
          adminDate: dto.adminDate,
          adminTimestamp: new Date().toISOString(),
        }),
      },
    });
  }

  async getPrescriptionForPrint(id: string) {
    const rx = await this.prisma.prescription.findUnique({
      where: { id },
      include: {
        patient: true,
        encounter: {
          include: {
            attendingDoctor: true,
          },
        },
        prescribedBy: true,
        items: {
          include: {
            medication: true,
          },
        },
      },
    });
    if (!rx) throw new NotFoundException('Prescription not found');
    return rx;
  }

  async getInvoiceForPrint(id: string) {
    const inv = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        patient: true,
        encounter: {
          include: {
            attendingDoctor: true,
          },
        },
        createdBy: true,
        items: {
          include: {
            service: true,
          },
        },
        payments: true,
      },
    });
    if (!inv) throw new NotFoundException('Invoice not found');
    return inv;
  }

  async getLabResultForPrint(id: string) {
    const order = await this.prisma.labOrder.findUnique({
      where: { id },
      include: {
        patient: true,
        encounter: {
          include: {
            attendingDoctor: true,
          },
        },
        orderedBy: true,
        items: {
          include: {
            labTest: true,
            result: true,
          },
        },
      },
    });
    if (!order) throw new NotFoundException('Lab order not found');
    return order;
  }

  async getPatientForPrint(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        registeredBy: true,
      },
    });
    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }

  async getClinicalDocForPrint(id: string) {
    const doc = await this.prisma.clinicalNote.findUnique({
      where: { id },
      include: {
        encounter: {
          include: {
            patient: true,
            attendingDoctor: true,
          },
        },
      },
    });
    if (!doc) throw new NotFoundException('Clinical document not found');
    return doc;
  }
}
