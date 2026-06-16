import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  PatientAllergyDto,
  PatientDetailResponseDto,
  PatientResponseDto,
} from './dto/patient-response.dto';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { AddAllergyDto } from './dto/add-allergy.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { CryptoService } from '@/common/security/crypto.service';
import { diceCoefficient } from '@/common/utils/string-similarity';

const detailInclude = {
  allergies: { orderBy: { createdAt: 'desc' } },
  encounters: {
    orderBy: { startTime: 'desc' },
    take: 5,
    include: { attendingDoctor: { select: { fullName: true } } },
  },
} satisfies Prisma.PatientInclude;

type PatientWithDetail = Prisma.PatientGetPayload<{
  include: typeof detailInclude;
}>;

@Injectable()
export class PatientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  async findAll(): Promise<PatientResponseDto[]> {
    const patients = await this.prisma.patient.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return patients.map((patient) => this.toResponse(patient));
  }

  async findOne(id: string): Promise<PatientDetailResponseDto> {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: detailInclude,
    });
    if (!patient) {
      throw new NotFoundException(`Patient ${id} not found`);
    }
    return this.toDetailResponse(patient);
  }

  async create(
    dto: CreatePatientDto,
    registeredById: string,
  ): Promise<PatientResponseDto> {
    const { overrideDuplicate, ...patientData } = dto;

    if (!overrideDuplicate) {
      const duplicate = await this.findDuplicate(dto);
      if (duplicate) {
        throw new ConflictException(
          `Possible duplicate of patient ${duplicate.mrn} (${duplicate.reason}). ` +
            `Re-submit with overrideDuplicate=true to register anyway.`,
        );
      }
    }

    const patient = await this.prisma.patient.create({
      data: {
        ...patientData,
        // PHI encrypted at app level before write.
        firstName: this.crypto.encrypt(patientData.firstName),
        lastName: this.crypto.encrypt(patientData.lastName),
        address: patientData.address
          ? this.crypto.encrypt(patientData.address)
          : undefined,
        nrcNumber: patientData.nrcNumber
          ? this.crypto.encrypt(patientData.nrcNumber)
          : undefined,
        nrcHash: patientData.nrcNumber
          ? this.crypto.blindIndex(patientData.nrcNumber)
          : undefined,
        mrn: await this.generateMrn(),
        dateOfBirth: new Date(dto.dateOfBirth),
        registeredById,
      },
    });
    return this.toResponse(patient);
  }

  /**
   * Duplicate detection (CLAUDE.md Feature 1): NRC exact match, OR a name
   * similarity ≥ 80% combined with an exact DOB + phone match.
   */
  private async findDuplicate(
    dto: CreatePatientDto,
  ): Promise<{ mrn: string; reason: string } | null> {
    if (dto.nrcNumber) {
      // Match via the blind index (NRC is stored encrypted, non-deterministic).
      const byNrc = await this.prisma.patient.findFirst({
        where: {
          nrcHash: this.crypto.blindIndex(dto.nrcNumber),
          isActive: true,
        },
        select: { mrn: true },
      });
      if (byNrc) return { mrn: byNrc.mrn, reason: 'same NRC' };
    }

    // DOB + phone are not encrypted, so they pre-filter cheaply; names are then
    // decrypted in-memory for the similarity comparison.
    const candidates = await this.prisma.patient.findMany({
      where: {
        dateOfBirth: new Date(dto.dateOfBirth),
        primaryPhone: dto.primaryPhone,
        isActive: true,
      },
      select: { mrn: true, firstName: true, lastName: true },
    });

    const incoming = `${dto.firstName} ${dto.lastName}`;
    for (const candidate of candidates) {
      const name = `${this.crypto.safeDecrypt(candidate.firstName) ?? ''} ${
        this.crypto.safeDecrypt(candidate.lastName) ?? ''
      }`;
      const score = diceCoefficient(incoming, name);
      if (score >= 0.8) {
        return {
          mrn: candidate.mrn,
          reason: `${Math.round(score * 100)}% name match with same DOB & phone`,
        };
      }
    }

    return null;
  }

  async update(id: string, dto: UpdatePatientDto): Promise<PatientResponseDto> {
    await this.ensureExists(id);
    const { overrideDuplicate: _ignored, ...rest } = dto;

    const data: Prisma.PatientUpdateInput = {
      ...rest,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
    };
    // Re-encrypt only the PHI fields actually being changed.
    if (dto.firstName !== undefined)
      data.firstName = this.crypto.encrypt(dto.firstName);
    if (dto.lastName !== undefined)
      data.lastName = this.crypto.encrypt(dto.lastName);
    if (dto.address !== undefined)
      data.address = dto.address ? this.crypto.encrypt(dto.address) : null;
    if (dto.nrcNumber !== undefined) {
      data.nrcNumber = dto.nrcNumber
        ? this.crypto.encrypt(dto.nrcNumber)
        : null;
      data.nrcHash = dto.nrcNumber
        ? this.crypto.blindIndex(dto.nrcNumber)
        : null;
    }

    const patient = await this.prisma.patient.update({ where: { id }, data });
    return this.toResponse(patient);
  }

  async remove(id: string): Promise<void> {
    await this.ensureExists(id);
    await this.prisma.patient.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Generates the next MRN as `MRN-` + 7-digit zero-padded sequence value.
   * Backed by the `patient_mrn_seq` Postgres sequence (concurrency-safe).
   */
  private async generateMrn(): Promise<string> {
    const rows = await this.prisma.$queryRaw<
      { nextval: bigint }[]
    >`SELECT nextval('patient_mrn_seq') AS nextval`;
    const next = rows[0]?.nextval ?? 0n;
    return `MRN-${next.toString().padStart(7, '0')}`;
  }

  private async ensureExists(id: string): Promise<void> {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!patient) {
      throw new NotFoundException(`Patient ${id} not found`);
    }
  }

  private toResponse(patient: {
    id: string;
    mrn: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: string;
    nrcNumber: string | null;
    bloodType: string;
    primaryPhone: string;
    secondaryPhone: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    township: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): PatientResponseDto {
    return {
      id: patient.id,
      mrn: patient.mrn,
      firstName: this.crypto.safeDecrypt(patient.firstName) ?? '',
      lastName: this.crypto.safeDecrypt(patient.lastName) ?? '',
      dateOfBirth: patient.dateOfBirth.toISOString().slice(0, 10),
      gender: patient.gender,
      nrcNumber: this.crypto.safeDecrypt(patient.nrcNumber) ?? undefined,
      bloodType: patient.bloodType,
      primaryPhone: patient.primaryPhone,
      secondaryPhone: patient.secondaryPhone ?? undefined,
      email: patient.email ?? undefined,
      address: this.crypto.safeDecrypt(patient.address) ?? undefined,
      city: patient.city ?? undefined,
      township: patient.township ?? undefined,
      isActive: patient.isActive,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
    };
  }

  private toDetailResponse(
    patient: PatientWithDetail,
  ): PatientDetailResponseDto {
    return {
      ...this.toResponse(patient),
      allergies: patient.allergies.map((allergy) => ({
        id: allergy.id,
        allergenType: allergy.allergenType,
        allergenName: allergy.allergenName,
        severity: allergy.severity,
        reaction: allergy.reaction ?? undefined,
      })),
      recentEncounters: patient.encounters.map((encounter) => ({
        id: encounter.id,
        encounterNo: encounter.encounterNo,
        date: encounter.startTime.toISOString().slice(0, 10),
        type: encounter.encounterType,
        doctor: encounter.attendingDoctor?.fullName ?? undefined,
        status: encounter.status,
      })),
    };
  }

  async addAllergy(
    patientId: string,
    dto: AddAllergyDto,
    recordedById: string,
  ): Promise<PatientAllergyDto> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true },
    });
    if (!patient) {
      throw new NotFoundException(`Patient ${patientId} not found`);
    }

    const allergy = await this.prisma.allergy.create({
      data: {
        patientId,
        allergenType: dto.allergenType,
        allergenName: dto.allergenName,
        severity: dto.severity,
        reaction: dto.reaction ?? '',
        confirmedById: recordedById,
        status: 'ACTIVE',
      },
    });

    return {
      id: allergy.id,
      allergenType: allergy.allergenType,
      allergenName: allergy.allergenName,
      severity: allergy.severity,
      reaction: allergy.reaction ?? undefined,
    };
  }
}
