import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomInt } from 'crypto';
import { Prisma } from '@prisma/client';
import { Role } from '@/authorization/roles/role.enum';
import { PrismaService } from '@/prisma/prisma.service';
import type { User } from '@/modules/users/entities/user.entity';
import { AuditService } from '@/modules/audit/audit.service';
import {
  EncounterDetailResponseDto,
  EncounterDiagnosisDto,
  EncounterResponseDto,
  EncounterVitalsDto,
  EncounterWriteResponseDto,
} from './dto/encounter-response.dto';
import {
  AddDiagnosisDto,
  CreateLabOrderDto,
  CreateMedicalOrderDto,
  CreatePrescriptionDto,
  CreateSoapNoteDto,
  RecordEncounterVitalsDto,
  UpdateEncounterStatusDto,
} from './dto/encounter-write.dto';

const encounterInclude = {
  patient: true,
  attendingDoctor: { select: { id: true, fullName: true } },
} satisfies Prisma.EncounterInclude;

type EncounterWithBaseRelations = Prisma.EncounterGetPayload<{
  include: typeof encounterInclude;
}>;

@Injectable()
export class EncountersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(user: User): Promise<EncounterResponseDto[]> {
    const where: Prisma.EncounterWhereInput = {};
    if (user.role === Role.Doctor) {
      where.attendingDoctorId = user.id;
    }

    const encounters = await this.prisma.encounter.findMany({
      where,
      include: encounterInclude,
      orderBy: { startTime: 'desc' },
    });
    return encounters.map((encounter) => this.toEncounterResponse(encounter));
  }

  async findOne(id: string): Promise<EncounterDetailResponseDto> {
    const encounter = await this.prisma.encounter.findUnique({
      where: { id },
      include: encounterInclude,
    });

    if (!encounter) {
      throw new NotFoundException(`Encounter ${id} not found`);
    }

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const [
      allergies,
      prescriptions,
      problemList,
      pastEncounters,
      vitals,
      diagnoses,
    ] = await Promise.all([
      this.prisma.allergy.findMany({
        where: { patientId: encounter.patientId, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.prescription.findMany({
        where: {
          patientId: encounter.patientId,
          prescribedAt: { gte: ninetyDaysAgo },
        },
        include: { items: { include: { medication: true } } },
        orderBy: { prescribedAt: 'desc' },
      }),
      this.prisma.diagnosis.findMany({
        where: { patientId: encounter.patientId, status: 'ACTIVE' },
        orderBy: { diagnosedAt: 'desc' },
      }),
      this.prisma.encounter.findMany({
        where: { patientId: encounter.patientId, id: { not: encounter.id } },
        orderBy: { startTime: 'desc' },
        take: 3,
      }),
      this.prisma.vitalSign.findFirst({
        where: { encounterId: encounter.id },
        orderBy: { recordedAt: 'desc' },
      }),
      this.prisma.diagnosis.findMany({
        where: { encounterId: encounter.id },
        orderBy: { diagnosedAt: 'desc' },
      }),
    ]);

    return {
      ...this.toEncounterResponse(encounter),
      allergies: allergies.map((allergy) => ({
        allergenName: allergy.allergenName,
        severity: allergy.severity,
      })),
      currentMeds: prescriptions.flatMap((prescription) =>
        prescription.items.map((item) => ({
          name: item.medication.genericName,
          dose: [item.dose, item.frequency].filter(Boolean).join(' '),
        })),
      ),
      problemList: problemList.map((diagnosis) => ({
        icd10Code: diagnosis.icd10Code,
        description: diagnosis.description,
      })),
      pastEncounters: pastEncounters.map((past) => ({
        encounterNo: past.encounterNo,
        date: past.startTime.toISOString(),
        type: past.encounterType,
      })),
      vitals: vitals ? this.toVitalsResponse(vitals) : undefined,
      diagnoses: diagnoses.map((diagnosis) =>
        this.toDiagnosisResponse(diagnosis),
      ),
    };
  }

  async recordVitals(
    encounterId: string,
    dto: RecordEncounterVitalsDto,
    recordedById: string,
  ): Promise<EncounterWriteResponseDto> {
    const encounter = await this.ensureOpenEncounter(encounterId);
    const bmi =
      dto.weightKg && dto.heightCm
        ? new Prisma.Decimal(
            (dto.weightKg / (dto.heightCm / 100) ** 2).toFixed(1),
          )
        : undefined;

    const vitals = await this.prisma.vitalSign.create({
      data: {
        encounterId,
        patientId: encounter.patientId,
        recordedById,
        systolicBp: dto.systolicBp,
        diastolicBp: dto.diastolicBp,
        heartRate: dto.heartRate,
        respiratoryRate: dto.respiratoryRate,
        temperatureCelsius:
          dto.temperature == null
            ? undefined
            : new Prisma.Decimal(dto.temperature),
        oxygenSaturation:
          dto.oxygenSaturation == null
            ? undefined
            : new Prisma.Decimal(dto.oxygenSaturation),
        weightKg:
          dto.weightKg == null ? undefined : new Prisma.Decimal(dto.weightKg),
        heightCm:
          dto.heightCm == null ? undefined : new Prisma.Decimal(dto.heightCm),
        bmi,
        painScore: dto.painScore,
        notes: dto.notes,
      },
      select: {
        id: true,
        systolicBp: true,
        diastolicBp: true,
        heartRate: true,
        temperatureCelsius: true,
        oxygenSaturation: true,
        weightKg: true,
        heightCm: true,
        bmi: true,
        painScore: true,
        notes: true,
      },
    });

    await this.auditService.create({
      userId: recordedById,
      action: 'RECORD_VITALS',
      module: 'ENCOUNTER',
      resourceId: encounterId,
      newData: vitals,
    });

    return { id: vitals.id };
  }

  async createSoapNote(
    encounterId: string,
    dto: CreateSoapNoteDto,
    authorId: string,
  ): Promise<EncounterWriteResponseDto> {
    await this.ensureOpenEncounter(encounterId);

    const note = await this.prisma.clinicalNote.create({
      data: {
        encounterId,
        authorId,
        noteType: 'SOAP',
        subjective: dto.subjective,
        objective: dto.objective,
        assessment: dto.assessment,
        plan: dto.plan,
        isAmended: Boolean(dto.amendedFrom),
        amendedFrom: dto.amendedFrom,
      },
      select: {
        id: true,
        subjective: true,
        objective: true,
        assessment: true,
        plan: true,
        isAmended: true,
        amendedFrom: true,
      },
    });

    await this.auditService.create({
      userId: authorId,
      action: 'CREATE_SOAP_NOTE',
      module: 'ENCOUNTER',
      resourceId: encounterId,
      newData: note,
    });

    return { id: note.id };
  }

  async addDiagnosis(
    encounterId: string,
    dto: AddDiagnosisDto,
    diagnosedById: string,
  ): Promise<EncounterWriteResponseDto> {
    const encounter = await this.ensureOpenEncounter(encounterId);

    const diagnosis = await this.prisma.diagnosis.create({
      data: {
        encounterId,
        patientId: encounter.patientId,
        icd10Code: dto.icd10Code,
        description: dto.description,
        type: dto.type,
        status: dto.status ?? 'ACTIVE',
        diagnosedById,
        notes: dto.notes,
      },
      select: {
        id: true,
        icd10Code: true,
        description: true,
        type: true,
        status: true,
        notes: true,
      },
    });

    await this.auditService.create({
      userId: diagnosedById,
      action: 'ADD_DIAGNOSIS',
      module: 'ENCOUNTER',
      resourceId: encounterId,
      newData: diagnosis,
    });

    return { id: diagnosis.id };
  }

  async createPrescription(
    encounterId: string,
    dto: CreatePrescriptionDto,
    prescribedById: string,
  ): Promise<EncounterWriteResponseDto> {
    const encounter = await this.ensureOpenEncounter(encounterId);
    const medication = await this.prisma.medication.findUnique({
      where: { id: dto.medicationId },
    });

    if (!medication) {
      throw new NotFoundException(`Medication ${dto.medicationId} not found`);
    }

    const allergies = await this.prisma.allergy.findMany({
      where: {
        patientId: encounter.patientId,
        allergenType: 'DRUG',
        status: 'ACTIVE',
      },
    });
    const drugNames = [medication.genericName, medication.brandName]
      .filter(Boolean)
      .map((name) => name!.toLowerCase());
    const matchedAllergy = allergies.find((allergy) =>
      drugNames.some((name) =>
        name.includes(allergy.allergenName.toLowerCase()),
      ),
    );

    if (matchedAllergy && !dto.overrideReason) {
      throw new BadRequestException(
        `Active allergy alert: ${matchedAllergy.allergenName}. Override reason is required.`,
      );
    }

    const prescription = await this.prisma.prescription.create({
      data: {
        rxNumber: await this.generateUniqueNo('RX', 'prescription'),
        encounterId,
        patientId: encounter.patientId,
        prescribedById,
        notes: dto.overrideReason
          ? [dto.notes, `Allergy override: ${dto.overrideReason}`]
              .filter(Boolean)
              .join('\n')
          : dto.notes,
        items: {
          create: {
            medicationId: dto.medicationId,
            dose: dto.dose,
            route: dto.route,
            frequency: dto.frequency,
            durationDays: dto.durationDays,
            quantityPrescribed: dto.quantityPrescribed,
            instructions: dto.instructions,
          },
        },
      },
      select: {
        id: true,
        rxNumber: true,
        notes: true,
        items: {
          select: {
            medicationId: true,
            dose: true,
            route: true,
            frequency: true,
            durationDays: true,
            quantityPrescribed: true,
          },
        },
      },
    });

    await this.auditService.create({
      userId: prescribedById,
      action: 'CREATE_PRESCRIPTION',
      module: 'ENCOUNTER',
      resourceId: encounterId,
      newData: prescription,
    });

    return { id: prescription.id };
  }

  async createLabOrder(
    encounterId: string,
    dto: CreateLabOrderDto,
    orderedById: string,
  ): Promise<EncounterWriteResponseDto> {
    const encounter = await this.ensureOpenEncounter(encounterId);

    const order = await this.prisma.labOrder.create({
      data: {
        orderNo: await this.generateUniqueNo('LAB', 'labOrder'),
        encounterId,
        patientId: encounter.patientId,
        orderedById,
        priority: dto.priority ?? 'ROUTINE',
        clinicalNotes: dto.clinicalNotes,
        items: {
          create: dto.labTestIds.map((labTestId) => ({ labTestId })),
        },
      },
      select: {
        id: true,
        orderNo: true,
        priority: true,
        clinicalNotes: true,
        items: { select: { labTestId: true } },
      },
    });

    await this.auditService.create({
      userId: orderedById,
      action: 'CREATE_LAB_ORDER',
      module: 'ENCOUNTER',
      resourceId: encounterId,
      newData: order,
    });

    return { id: order.id };
  }

  async createMedicalOrder(
    encounterId: string,
    dto: CreateMedicalOrderDto,
    orderedById: string,
  ): Promise<EncounterWriteResponseDto> {
    await this.ensureOpenEncounter(encounterId);

    const order = await this.prisma.medicalOrder.create({
      data: {
        encounterId,
        orderedById,
        orderType: dto.orderType,
        priority: dto.priority ?? 'ROUTINE',
        description: dto.description,
        details: dto.details as Prisma.InputJsonValue | undefined,
        notes: dto.notes,
      },
      select: {
        id: true,
        orderType: true,
        priority: true,
        description: true,
        details: true,
        notes: true,
      },
    });

    await this.auditService.create({
      userId: orderedById,
      action: 'CREATE_MEDICAL_ORDER',
      module: 'ENCOUNTER',
      resourceId: encounterId,
      newData: order,
    });

    return { id: order.id };
  }

  async updateStatus(
    encounterId: string,
    dto: UpdateEncounterStatusDto,
    user: User,
  ): Promise<EncounterResponseDto> {
    if (
      dto.status === 'CANCELLED' &&
      user.role !== Role.Admin &&
      user.role !== Role.SuperAdmin
    ) {
      throw new ForbiddenException('Only admins can cancel encounters.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const encounter = await tx.encounter.findUnique({
        where: { id: encounterId },
        include: encounterInclude,
      });

      if (!encounter) {
        throw new NotFoundException(`Encounter ${encounterId} not found`);
      }

      if (encounter.status !== 'OPEN') {
        throw new BadRequestException('Only open encounters can be updated.');
      }

      if (dto.status === 'COMPLETED') {
        const diagnosisCount = await tx.diagnosis.count({
          where: { encounterId },
        });
        if (diagnosisCount < 1) {
          throw new BadRequestException(
            'At least one diagnosis is required before completing an encounter.',
          );
        }

        await tx.invoice.create({
          data: {
            invoiceNo: await this.generateUniqueNo('INV', 'invoice', tx),
            encounterId,
            patientId: encounter.patientId,
            subtotal: new Prisma.Decimal(0),
            totalAmount: new Prisma.Decimal(0),
            patientBalance: new Prisma.Decimal(0),
            createdById: user.id,
            notes: 'Auto-created when encounter was completed.',
          },
        });
      }

      const updatedEncounter = await tx.encounter.update({
        where: { id: encounterId },
        data: {
          status: dto.status,
          endTime: dto.status === 'COMPLETED' ? new Date() : undefined,
        },
        include: encounterInclude,
      });

      await this.auditService.create({
        userId: user.id,
        action: `UPDATE_STATUS_${dto.status}`,
        module: 'ENCOUNTER',
        resourceId: encounterId,
        oldData: { status: encounter.status },
        newData: { status: updatedEncounter.status },
      });

      return updatedEncounter;
    });

    return this.toEncounterResponse(updated);
  }

  private async ensureOpenEncounter(
    id: string,
  ): Promise<{ patientId: string }> {
    const encounter = await this.prisma.encounter.findUnique({
      where: { id },
      select: { patientId: true, status: true },
    });

    if (!encounter) {
      throw new NotFoundException(`Encounter ${id} not found`);
    }

    if (encounter.status !== 'OPEN') {
      throw new BadRequestException('Encounter is not open.');
    }

    return encounter;
  }

  private async generateUniqueNo(
    prefix: string,
    model: 'encounter' | 'prescription' | 'labOrder' | 'invoice',
    client: Prisma.TransactionClient | PrismaService = this.prisma,
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
    client: Prisma.TransactionClient | PrismaService,
    model: 'encounter' | 'prescription' | 'labOrder' | 'invoice',
    candidate: string,
  ): Promise<{ id: string } | null> {
    switch (model) {
      case 'encounter':
        return client.encounter.findUnique({
          where: { encounterNo: candidate },
          select: { id: true },
        });
      case 'prescription':
        return client.prescription.findUnique({
          where: { rxNumber: candidate },
          select: { id: true },
        });
      case 'labOrder':
        return client.labOrder.findUnique({
          where: { orderNo: candidate },
          select: { id: true },
        });
      case 'invoice':
        return client.invoice.findUnique({
          where: { invoiceNo: candidate },
          select: { id: true },
        });
      default:
        throw new Error('Unsupported number model');
    }
  }

  private toEncounterResponse(
    encounter: EncounterWithBaseRelations,
  ): EncounterResponseDto {
    return {
      id: encounter.id,
      encounterNo: encounter.encounterNo,
      patientName: `${encounter.patient.firstName} ${encounter.patient.lastName}`,
      mrn: encounter.patient.mrn,
      doctorName: encounter.attendingDoctor.fullName,
      type: encounter.encounterType,
      startTime: encounter.startTime.toISOString(),
      status: encounter.status,
    };
  }

  private toVitalsResponse(vitals: {
    systolicBp: number | null;
    diastolicBp: number | null;
    heartRate: number | null;
    temperatureCelsius: Prisma.Decimal | null;
    oxygenSaturation: Prisma.Decimal | null;
    weightKg: Prisma.Decimal | null;
    recordedAt: Date;
  }): EncounterVitalsDto {
    return {
      systolicBp: vitals.systolicBp ?? undefined,
      diastolicBp: vitals.diastolicBp ?? undefined,
      heartRate: vitals.heartRate ?? undefined,
      temperature: vitals.temperatureCelsius?.toNumber(),
      oxygenSaturation: vitals.oxygenSaturation?.toNumber(),
      weightKg: vitals.weightKg?.toNumber(),
      recordedAt: vitals.recordedAt.toISOString(),
    };
  }

  private toDiagnosisResponse(diagnosis: {
    icd10Code: string;
    description: string;
    type: string;
  }): EncounterDiagnosisDto {
    return {
      icd10Code: diagnosis.icd10Code,
      description: diagnosis.description,
      type: diagnosis.type,
    };
  }
}
