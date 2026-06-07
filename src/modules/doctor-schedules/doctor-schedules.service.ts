import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { seedIfEmpty } from '@/common/catalog/seed-if-empty';
import { DAY_LABELS, DOCTOR_SCHEDULE_SEEDS } from './doctor-schedules.seed';
import type {
  CreateDoctorScheduleDto,
  UpdateDoctorScheduleDto,
} from './dto/doctor-schedule.dto';
import type { DoctorScheduleResponseDto } from './dto/doctor-schedule-response.dto';

@Injectable()
export class DoctorSchedulesService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await seedIfEmpty(
      () => this.prisma.doctorSchedule.count(),
      async () => {
        const doctorRole = await this.prisma.role.findUnique({
          where: { code: 'DOCTOR' },
        });
        if (!doctorRole) return;

        const doctor = await this.prisma.user.findFirst({
          where: { roleId: doctorRole.id, status: 'ACTIVE' },
        });
        if (!doctor) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await this.prisma.doctorSchedule.createMany({
          data: DOCTOR_SCHEDULE_SEEDS.map((seed) => ({
            doctorId: doctor.id,
            dayOfWeek: seed.dayOfWeek,
            startTime: seed.startTime,
            endTime: seed.endTime,
            slotMinutes: seed.slotMinutes,
            validFrom: today,
          })),
          skipDuplicates: true,
        });
      },
    );
  }

  async findAll(filters?: {
    doctorId?: string;
    dayOfWeek?: number;
  }): Promise<DoctorScheduleResponseDto[]> {
    const rows = await this.prisma.doctorSchedule.findMany({
      where: {
        ...(filters?.doctorId ? { doctorId: filters.doctorId } : {}),
        ...(filters?.dayOfWeek !== undefined
          ? { dayOfWeek: filters.dayOfWeek }
          : {}),
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
    return this.serializeMany(rows);
  }

  async findOne(id: string): Promise<DoctorScheduleResponseDto> {
    const row = await this.prisma.doctorSchedule.findUnique({ where: { id } });
    if (!row) throw new NotFoundException(`Doctor schedule ${id} not found`);
    return this.serializeOne(row);
  }

  async create(
    dto: CreateDoctorScheduleDto,
  ): Promise<DoctorScheduleResponseDto> {
    await this.assertDoctor(dto.doctorId);
    await this.assertNoOverlap({
      doctorId: dto.doctorId,
      dayOfWeek: dto.dayOfWeek,
      startTime: dto.startTime,
      endTime: dto.endTime,
    });

    const validFrom = dto.validFrom
      ? new Date(dto.validFrom)
      : this.todayDate();
    const row = await this.prisma.doctorSchedule.create({
      data: {
        doctorId: dto.doctorId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        slotMinutes: dto.slotMinutes ?? 15,
        validFrom,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
      },
    });
    return this.serializeOne(row);
  }

  async update(
    id: string,
    dto: UpdateDoctorScheduleDto,
  ): Promise<DoctorScheduleResponseDto> {
    const existing = await this.prisma.doctorSchedule.findUnique({
      where: { id },
    });
    if (!existing)
      throw new NotFoundException(`Doctor schedule ${id} not found`);

    if (dto.doctorId) await this.assertDoctor(dto.doctorId);

    const merged = {
      doctorId: dto.doctorId ?? existing.doctorId,
      dayOfWeek: dto.dayOfWeek ?? existing.dayOfWeek,
      startTime: dto.startTime ?? existing.startTime,
      endTime: dto.endTime ?? existing.endTime,
    };

    if (merged.startTime >= merged.endTime) {
      throw new BadRequestException('startTime must be before endTime');
    }

    await this.assertNoOverlap({ ...merged, excludeId: id });

    const row = await this.prisma.doctorSchedule.update({
      where: { id },
      data: {
        doctorId: dto.doctorId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        slotMinutes: dto.slotMinutes,
        ...(dto.validFrom !== undefined
          ? { validFrom: new Date(dto.validFrom) }
          : {}),
        ...(dto.validUntil !== undefined
          ? {
              validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
            }
          : {}),
      },
    });
    return this.serializeOne(row);
  }

  async setIsActive(
    id: string,
    isActive: boolean,
  ): Promise<DoctorScheduleResponseDto> {
    await this.findOne(id);
    const row = await this.prisma.doctorSchedule.update({
      where: { id },
      data: { isActive },
    });
    return this.serializeOne(row);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.doctorSchedule.delete({ where: { id } });
    return { deleted: true };
  }

  private async assertDoctor(doctorId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: doctorId },
      include: { role: true },
    });
    if (!user) throw new NotFoundException(`Doctor ${doctorId} not found`);
    if (user.role.code !== 'DOCTOR') {
      throw new BadRequestException('Selected user is not a doctor');
    }
    if (user.status !== 'ACTIVE') {
      throw new BadRequestException('Doctor account is not active');
    }
  }

  private async assertNoOverlap(params: {
    doctorId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    excludeId?: string;
  }): Promise<void> {
    const rows = await this.prisma.doctorSchedule.findMany({
      where: {
        doctorId: params.doctorId,
        dayOfWeek: params.dayOfWeek,
        isActive: true,
        ...(params.excludeId ? { id: { not: params.excludeId } } : {}),
      },
    });

    for (const row of rows) {
      if (params.startTime < row.endTime && row.startTime < params.endTime) {
        throw new BadRequestException(
          'Schedule overlaps an existing slot for this doctor and day',
        );
      }
    }
  }

  private todayDate(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private async serializeMany(
    rows: Awaited<ReturnType<PrismaService['doctorSchedule']['findMany']>>,
  ): Promise<DoctorScheduleResponseDto[]> {
    if (rows.length === 0) return [];

    const doctorIds = [...new Set(rows.map((r) => r.doctorId))];
    const doctors = await this.prisma.user.findMany({
      where: { id: { in: doctorIds } },
      select: { id: true, fullName: true },
    });
    const nameById = new Map(doctors.map((d) => [d.id, d.fullName]));

    return rows.map((row) =>
      this.toResponse(row, nameById.get(row.doctorId) ?? 'Unknown'),
    );
  }

  private async serializeOne(
    row: NonNullable<
      Awaited<ReturnType<PrismaService['doctorSchedule']['findUnique']>>
    >,
  ): Promise<DoctorScheduleResponseDto> {
    const doctor = await this.prisma.user.findUnique({
      where: { id: row.doctorId },
      select: { fullName: true },
    });
    return this.toResponse(row, doctor?.fullName ?? 'Unknown');
  }

  private toResponse(
    row: {
      id: string;
      doctorId: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      slotMinutes: number;
      isActive: boolean;
      validFrom: Date;
      validUntil: Date | null;
    },
    doctorName: string,
  ): DoctorScheduleResponseDto {
    return {
      id: row.id,
      doctorId: row.doctorId,
      doctorName,
      dayOfWeek: row.dayOfWeek,
      dayLabel: DAY_LABELS[row.dayOfWeek] ?? String(row.dayOfWeek),
      startTime: row.startTime,
      endTime: row.endTime,
      slotMinutes: row.slotMinutes,
      isActive: row.isActive,
      validFrom: row.validFrom,
      validUntil: row.validUntil,
    };
  }
}
