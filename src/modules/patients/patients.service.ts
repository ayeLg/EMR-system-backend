import { Injectable, NotFoundException } from '@nestjs/common';
import { PatientResponseDto } from './dto/patient-response.dto';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PrismaService } from '@/prisma/prisma.service';

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

  async findOne(id: string): Promise<PatientResponseDto> {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        allergies: true,
        encounters: {
          orderBy: { startTime: 'desc' },
          take: 5,
        },
      },
    });
    if (!patient) {
      throw new NotFoundException(`Patient ${id} not found`);
    }
    return this.toResponse(patient);
  }

  async create(
    dto: CreatePatientDto,
    registeredById: string,
  ): Promise<PatientResponseDto> {
    const patient = await this.prisma.patient.create({
      data: {
        ...dto,
        dateOfBirth: new Date(dto.dateOfBirth),
        registeredById,
      },
    });
    return this.toResponse(patient);
  }

  async update(id: string, dto: UpdatePatientDto): Promise<PatientResponseDto> {
    await this.findOne(id);
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
    await this.findOne(id);

    await this.prisma.patient.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private toResponse(patient: {
    id: string;
    mrn: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    createdAt: Date;
    updatedAt: Date;
  }): PatientResponseDto {
    return {
      id: patient.id,
      mrn: patient.mrn,
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth.toISOString().slice(0, 10),
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
    };
  }
}
