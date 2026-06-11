import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomBytes, randomInt } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AppointmentResponseDto } from './dto/appointment-response.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

const appointmentInclude = {
  patient: true,
  department: true,
} satisfies Prisma.AppointmentInclude;

type AppointmentWithRelations = Prisma.AppointmentGetPayload<{
  include: typeof appointmentInclude;
}>;

@Injectable()
export class AppointmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<AppointmentResponseDto[]> {
    const appointments = await this.prisma.appointment.findMany({
      include: appointmentInclude,
      orderBy: { scheduledAt: 'desc' },
    });
    const doctorNames = await this.getDoctorNameMap(
      appointments.map((appointment) => appointment.doctorId),
    );
    return appointments.map((appointment) =>
      this.toResponse(appointment, doctorNames),
    );
  }

  async findNurseQueue(): Promise<AppointmentResponseDto[]> {
    const appointments = await this.prisma.appointment.findMany({
      where: { status: 'ARRIVED' },
      include: appointmentInclude,
      orderBy: { scheduledAt: 'asc' },
    });
    const doctorNames = await this.getDoctorNameMap(
      appointments.map((appointment) => appointment.doctorId),
    );
    return appointments.map((appointment) =>
      this.toResponse(appointment, doctorNames),
    );
  }

  async findOne(id: string): Promise<AppointmentResponseDto> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: appointmentInclude,
    });
    if (!appointment) {
      throw new NotFoundException(`Appointment ${id} not found`);
    }
    const doctorNames = await this.getDoctorNameMap([appointment.doctorId]);
    return this.toResponse(appointment, doctorNames);
  }

  async create(
    dto: CreateAppointmentDto,
    bookedById: string,
  ): Promise<AppointmentResponseDto> {
    const apptDate = new Date(dto.scheduledAt);
    const { dayOfWeek, hour, minute } = this.getLocalTimeDetails(apptDate);
    const apptMinutes = hour * 60 + minute;

    // 1. Fetch active doctor schedules for this day of week
    const schedules = await this.prisma.doctorSchedule.findMany({
      where: {
        doctorId: dto.doctorId,
        dayOfWeek,
        isActive: true,
        validFrom: { lte: apptDate },
        OR: [{ validUntil: null }, { validUntil: { gte: apptDate } }],
      },
    });

    if (schedules.length === 0) {
      throw new BadRequestException(
        'Doctor is not scheduled to work on this day.',
      );
    }

    // 2. Check if appointment time falls within any working shift
    let withinShift = false;
    for (const schedule of schedules) {
      const [startH, startM] = schedule.startTime.split(':').map(Number);
      const [endH, endM] = schedule.endTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      if (apptMinutes >= startMinutes && apptMinutes <= endMinutes) {
        withinShift = true;
        break;
      }
    }

    if (!withinShift) {
      const shiftsStr = schedules
        .map((s) => `${s.startTime}-${s.endTime}`)
        .join(', ');
      throw new BadRequestException(
        `Selected time is outside the doctor's working hours. Available shifts: ${shiftsStr}`,
      );
    }

    // 3. Double Booking check (Overlapping doctor appointments)
    const duration = dto.durationMinutes ?? 15;
    const apptStart = apptDate.getTime();
    const apptEnd = apptStart + duration * 60 * 1000;

    const startOfDay = new Date(apptDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(apptDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingDoctorAppts = await this.prisma.appointment.findMany({
      where: {
        doctorId: dto.doctorId,
        status: {
          notIn: ['CANCELLED', 'NO_SHOW'],
        },
        scheduledAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    for (const appt of existingDoctorAppts) {
      const existingStart = appt.scheduledAt.getTime();
      const existingEnd = existingStart + appt.durationMinutes * 60 * 1000;

      if (apptStart < existingEnd && apptEnd > existingStart) {
        throw new BadRequestException('Doctor is already booked at this time.');
      }
    }

    // 4. Overlapping patient appointments check
    const existingPatientAppts = await this.prisma.appointment.findMany({
      where: {
        patientId: dto.patientId,
        status: {
          notIn: ['CANCELLED', 'NO_SHOW'],
        },
        scheduledAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    for (const appt of existingPatientAppts) {
      const existingStart = appt.scheduledAt.getTime();
      const existingEnd = existingStart + appt.durationMinutes * 60 * 1000;

      if (apptStart < existingEnd && apptEnd > existingStart) {
        throw new BadRequestException(
          'Patient already has an appointment at this time.',
        );
      }
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        ...dto,
        appointmentNo: await this.generateAppointmentNo(),
        scheduledAt: apptDate,
        bookedById,
      },
      include: appointmentInclude,
    });
    const doctorNames = await this.getDoctorNameMap([appointment.doctorId]);
    return this.toResponse(appointment, doctorNames);
  }

  private getLocalTimeDetails(date: Date, timeZone = 'Asia/Yangon') {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hourCycle: 'h23',
    });

    const parts = formatter.formatToParts(date);
    const partValues: Record<string, string> = {};
    for (const part of parts) {
      partValues[part.type] = part.value;
    }

    const year = Number(partValues.year);
    const month = Number(partValues.month) - 1;
    const day = Number(partValues.day);
    const hour = Number(partValues.hour);
    const minute = Number(partValues.minute);

    const localDateObj = new Date(year, month, day, hour, minute);
    return {
      dayOfWeek: localDateObj.getDay(),
      hour,
      minute,
    };
  }

  async update(
    id: string,
    dto: UpdateAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    await this.ensureExists(id);
    const appointment = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id },
        data: {
          ...dto,
          scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        },
        include: appointmentInclude,
      });

      if (dto.status === 'IN_PROGRESS') {
        const existing = await tx.encounter.findUnique({
          where: { appointmentId: id },
          select: { id: true },
        });

        if (!existing) {
          await tx.encounter.create({
            data: {
              encounterNo: await this.generateEncounterNo(tx),
              patientId: updated.patientId,
              appointmentId: updated.id,
              attendingDoctorId: updated.doctorId,
              encounterType: updated.type,
              status: 'OPEN',
              startTime: new Date(),
            },
          });
        }
      }

      return updated;
    });
    const doctorNames = await this.getDoctorNameMap([appointment.doctorId]);
    return this.toResponse(appointment, doctorNames);
  }

  async remove(id: string): Promise<void> {
    await this.ensureExists(id);
    await this.prisma.appointment.delete({ where: { id } });
  }

  private async ensureExists(id: string): Promise<void> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!appointment) {
      throw new NotFoundException(`Appointment ${id} not found`);
    }
  }

  private async generateAppointmentNo(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = `APT-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString('hex').toUpperCase()}`;
      const existing = await this.prisma.appointment.findUnique({
        where: { appointmentNo: candidate },
        select: { id: true },
      });
      if (!existing) {
        return candidate;
      }
    }
    throw new Error('Unable to generate a unique appointment number');
  }

  private async generateEncounterNo(
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const candidate = `ENC-${randomInt(0, 10_000_000)
        .toString()
        .padStart(7, '0')}`;
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

  private toResponse(
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
