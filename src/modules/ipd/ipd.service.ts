import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AuditService } from '@/modules/audit/audit.service';
import { CryptoService } from '@/common/security/crypto.service';
import { decryptPatientName } from '@/common/security/phi.util';
import {
  AdmitPatientDto,
  DischargePatientDto,
  CreateProgressNoteDto,
} from './dto/ipd.dto';

@Injectable()
export class IpdService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly crypto: CryptoService,
  ) {}

  async getWardOccupancy() {
    const wards = await this.prisma.ward.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    const activeEncounters = await this.prisma.encounter.findMany({
      where: {
        encounterType: 'IPD',
        status: 'OPEN',
      },
      select: {
        wardId: true,
        bedNumber: true,
      },
    });

    return wards.map((ward) => {
      const occupiedBeds = activeEncounters
        .filter((e) => e.wardId === ward.id)
        .map((e) => e.bedNumber)
        .filter((b): b is string => !!b);

      return {
        id: ward.id,
        code: ward.code,
        name: ward.name,
        totalBeds: ward.totalBeds,
        occupiedBeds: occupiedBeds.length,
        occupiedBedsList: occupiedBeds,
      };
    });
  }

  async getInpatients() {
    const encounters = await this.prisma.encounter.findMany({
      where: {
        encounterType: 'IPD',
        status: 'OPEN',
      },
      include: {
        patient: true,
        ward: true,
        attendingDoctor: { select: { id: true, fullName: true } },
        diagnoses: {
          orderBy: { diagnosedAt: 'desc' },
        },
      },
      orderBy: { admissionDate: 'desc' },
    });

    return encounters.map((e) => {
      const primaryDiagnosis =
        e.diagnoses.find(
          (d) => d.type === 'ADMITTING' || d.type === 'PRIMARY',
        ) || e.diagnoses[0];

      return {
        id: e.id,
        patientName: decryptPatientName(this.crypto, e.patient),
        patientId: e.patientId,
        mrn: e.patient.mrn,
        ward: e.ward?.name ?? 'Unknown Ward',
        wardId: e.wardId,
        bed: e.bedNumber ?? '—',
        admittedAt: e.admissionDate
          ? e.admissionDate.toISOString().split('T')[0]
          : e.createdAt.toISOString().split('T')[0],
        diagnosis: primaryDiagnosis
          ? `${primaryDiagnosis.description} (${primaryDiagnosis.icd10Code})`
          : '—',
        attendingDoctorName: e.attendingDoctor.fullName,
      };
    });
  }

  async admitPatient(dto: AdmitPatientDto, userId: string) {
    // Check if patient already admitted
    const activeEncounter = await this.prisma.encounter.findFirst({
      where: {
        patientId: dto.patientId,
        encounterType: 'IPD',
        status: 'OPEN',
      },
    });

    if (activeEncounter) {
      throw new BadRequestException('Patient is already admitted to a ward');
    }

    // Check if bed is already occupied in the ward
    const bedOccupied = await this.prisma.encounter.findFirst({
      where: {
        wardId: dto.wardId,
        bedNumber: dto.bedNumber,
        encounterType: 'IPD',
        status: 'OPEN',
      },
    });

    if (bedOccupied) {
      throw new BadRequestException(
        `Bed ${dto.bedNumber} is already occupied in this ward`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const encounterNo = await this.generateUniqueNo('ENC', 'encounter', tx);

      const encounter = await tx.encounter.create({
        data: {
          encounterNo,
          patientId: dto.patientId,
          attendingDoctorId: dto.attendingDoctorId,
          encounterType: 'IPD',
          status: 'OPEN',
          startTime: new Date(),
          wardId: dto.wardId,
          bedNumber: dto.bedNumber,
          admissionDate: new Date(dto.admissionDate),
        },
      });

      if (dto.diagnosis) {
        await tx.diagnosis.create({
          data: {
            encounterId: encounter.id,
            patientId: dto.patientId,
            icd10Code: dto.icd10Code || 'R69',
            description: dto.diagnosis,
            type: 'ADMITTING',
            status: 'ACTIVE',
            diagnosedById: dto.attendingDoctorId,
          },
        });
      }

      await this.auditService.create({
        userId,
        action: 'ADMIT_PATIENT',
        module: 'IPD',
        resourceId: encounter.id,
        newData: encounter,
      });

      return encounter;
    });

    return result;
  }

  async dischargePatient(id: string, dto: DischargePatientDto, userId: string) {
    const encounter = await this.prisma.encounter.findUnique({
      where: { id },
    });

    if (encounter?.encounterType !== 'IPD') {
      throw new NotFoundException(`Inpatient admission ${id} not found`);
    }

    if (encounter.status !== 'OPEN') {
      throw new BadRequestException('Patient is already discharged');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.encounter.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          dischargeDate: new Date(dto.dischargeDate),
          dischargeSummary: dto.dischargeSummary,
          endTime: new Date(),
        },
      });

      // Auto-generate invoice
      const invoiceNo = await this.generateUniqueNo('INV', 'invoice', tx);
      await tx.invoice.create({
        data: {
          invoiceNo,
          encounterId: id,
          patientId: encounter.patientId,
          subtotal: new Prisma.Decimal(0),
          totalAmount: new Prisma.Decimal(0),
          patientBalance: new Prisma.Decimal(0),
          createdById: userId,
          notes: 'Auto-created when inpatient was discharged.',
        },
      });

      await this.auditService.create({
        userId,
        action: 'DISCHARGE_PATIENT',
        module: 'IPD',
        resourceId: id,
        oldData: { status: encounter.status },
        newData: {
          status: updated.status,
          dischargeSummary: dto.dischargeSummary,
        },
      });

      return updated;
    });

    return result;
  }

  async addProgressNote(
    id: string,
    dto: CreateProgressNoteDto,
    userId: string,
  ) {
    const encounter = await this.prisma.encounter.findUnique({
      where: { id },
    });

    if (encounter?.encounterType !== 'IPD' || encounter?.status !== 'OPEN') {
      throw new BadRequestException('Patient is not currently admitted');
    }

    const note = await this.prisma.clinicalNote.create({
      data: {
        encounterId: id,
        authorId: userId,
        noteType: 'PROGRESS',
        content: dto.content,
      },
    });

    await this.auditService.create({
      userId,
      action: 'ADD_PROGRESS_NOTE',
      module: 'IPD',
      resourceId: id,
      newData: note,
    });

    return note;
  }

  private async generateUniqueNo(
    prefix: string,
    model: 'encounter' | 'invoice',
    client: Prisma.TransactionClient,
  ): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const candidate = `${prefix}-${randomInt(0, 10_000_000)
        .toString()
        .padStart(7, '0')}`;
      const existing = await this.findExistingNumber(client, model, candidate);
      if (!existing) {
        return candidate;
      }
    }
    throw new Error(`Unable to generate unique ${prefix} number`);
  }

  private findExistingNumber(
    client: Prisma.TransactionClient,
    model: 'encounter' | 'invoice',
    candidate: string,
  ): Promise<{ id: string } | null> {
    if (model === 'encounter') {
      return client.encounter.findUnique({
        where: { encounterNo: candidate },
        select: { id: true },
      });
    } else {
      return client.invoice.findUnique({
        where: { invoiceNo: candidate },
        select: { id: true },
      });
    }
  }
}
