import { Injectable, NotFoundException } from '@nestjs/common';
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
  constructor(private readonly prisma: PrismaService) {}

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
    const patient = await this.prisma.patient.create({
      data: {
        ...dto,
        mrn: await this.generateMrn(),
        dateOfBirth: new Date(dto.dateOfBirth),
        registeredById,
      },
    });
    return this.toResponse(patient);
  }

  async update(id: string, dto: UpdatePatientDto): Promise<PatientResponseDto> {
    await this.ensureExists(id);
    const patient = await this.prisma.patient.update({
      where: { id },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
    });
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
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth.toISOString().slice(0, 10),
      gender: patient.gender,
      nrcNumber: patient.nrcNumber ?? undefined,
      bloodType: patient.bloodType,
      primaryPhone: patient.primaryPhone,
      secondaryPhone: patient.secondaryPhone ?? undefined,
      email: patient.email ?? undefined,
      address: patient.address ?? undefined,
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
