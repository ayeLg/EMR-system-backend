import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
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
    const appointment = await this.prisma.appointment.create({
      data: {
        ...dto,
        appointmentNo: await this.generateAppointmentNo(),
        scheduledAt: new Date(dto.scheduledAt),
        bookedById,
      },
      include: appointmentInclude,
    });
    const doctorNames = await this.getDoctorNameMap([appointment.doctorId]);
    return this.toResponse(appointment, doctorNames);
  }

  async update(
    id: string,
    dto: UpdateAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    await this.ensureExists(id);
    const appointment = await this.prisma.appointment.update({
      where: { id },
      data: {
        ...dto,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      },
      include: appointmentInclude,
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
