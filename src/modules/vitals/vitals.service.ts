import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AppointmentResponseDto } from '@/modules/appointments/dto/appointment-response.dto';
import { RecordVitalsDto } from './dto/record-vitals.dto';

const appointmentInclude = {
  patient: true,
  department: true,
} satisfies Prisma.AppointmentInclude;

type AppointmentWithRelations = Prisma.AppointmentGetPayload<{
  include: typeof appointmentInclude;
}>;

@Injectable()
export class VitalsService {
  constructor(private readonly prisma: PrismaService) {}

  async recordAppointmentVitals(
    appointmentId: string,
    dto: RecordVitalsDto,
    recordedById: string,
  ): Promise<AppointmentResponseDto> {
    const calculatedBmi = this.calculateBmi(dto.weightKg, dto.heightCm);
    const appointment = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.appointment.findUnique({
        where: { id: appointmentId },
        include: { encounter: true },
      });

      if (!existing) {
        throw new NotFoundException(`Appointment ${appointmentId} not found`);
      }

      if (!['ARRIVED', 'IN_PROGRESS'].includes(existing.status)) {
        throw new BadRequestException(
          'Vitals can only be recorded for arrived appointments.',
        );
      }

      const encounter =
        existing.encounter ??
        (await tx.encounter.create({
          data: {
            encounterNo: await this.generateEncounterNo(tx),
            patientId: existing.patientId,
            appointmentId: existing.id,
            attendingDoctorId: existing.doctorId,
            encounterType: existing.type,
            status: 'OPEN',
            startTime: new Date(),
          },
        }));

      const vitalSign = await tx.vitalSign.create({
        data: {
          encounterId: encounter.id,
          patientId: existing.patientId,
          recordedById,
          systolicBp: dto.systolicBp,
          diastolicBp: dto.diastolicBp,
          heartRate: dto.heartRate,
          respiratoryRate: dto.respiratoryRate,
          temperatureCelsius: dto.temperature,
          oxygenSaturation: dto.oxygenSaturation,
          weightKg: dto.weightKg,
          heightCm: dto.heightCm,
          bmi: new Prisma.Decimal(calculatedBmi.toFixed(1)),
          painScore: dto.painScore,
        },
      });

      await tx.vitalSign.update({
        where: { id: vitalSign.id },
        data: { bmi: new Prisma.Decimal(calculatedBmi.toFixed(1)) },
      });

      return tx.appointment.update({
        where: { id: appointmentId },
        data: { status: 'IN_PROGRESS' },
        include: appointmentInclude,
      });
    });

    const doctorNames = await this.getDoctorNameMap([appointment.doctorId]);
    return this.toAppointmentResponse(appointment, doctorNames);
  }

  private calculateBmi(weightKg: number, heightCm: number): number {
    return Number((weightKg / (heightCm / 100) ** 2).toFixed(1));
  }

  private async generateEncounterNo(
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = `ENC-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString('hex').toUpperCase()}`;
      const existing = await tx.encounter.findUnique({
        where: { encounterNo: candidate },
        select: { id: true },
      });
      if (!existing) {
        return candidate;
      }
    }
    throw new Error('Unable to generate a unique encounter number');
  }

  private async getDoctorNameMap(
    doctorIds: string[],
  ): Promise<Map<string, string>> {
    const uniqueIds = [...new Set(doctorIds)].filter(Boolean);
    if (uniqueIds.length === 0) {
      return new Map();
    }

    const doctors = await this.prisma.user.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, fullName: true },
    });
    return new Map(doctors.map((doctor) => [doctor.id, doctor.fullName]));
  }

  private toAppointmentResponse(
    appointment: AppointmentWithRelations,
    doctorNames: Map<string, string>,
  ): AppointmentResponseDto {
    return {
      id: appointment.id,
      appointmentNo: appointment.appointmentNo,
      patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
      mrn: appointment.patient.mrn,
      doctorName: doctorNames.get(appointment.doctorId) ?? appointment.doctorId,
      department: appointment.department.name,
      scheduledAt: appointment.scheduledAt.toISOString(),
      type: appointment.type,
      status: appointment.status,
      chiefComplaint: appointment.chiefComplaint ?? undefined,
    };
  }
}
