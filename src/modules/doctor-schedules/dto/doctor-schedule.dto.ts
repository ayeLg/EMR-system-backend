import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const timeString = z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:mm format');

const DoctorScheduleFieldsSchema = z.object({
  doctorId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: timeString,
  endTime: timeString,
  slotMinutes: z.number().int().min(5).max(120).default(15),
  validFrom: z.string().date().optional(),
  validUntil: z.string().date().optional().nullable(),
});

function assertStartBeforeEnd(
  v: { startTime?: string; endTime?: string },
  ctx: z.RefinementCtx,
): void {
  if (v.startTime && v.endTime && v.startTime >= v.endTime) {
    ctx.addIssue({
      code: 'custom',
      message: 'startTime must be before endTime',
      path: ['endTime'],
    });
  }
}

export const CreateDoctorScheduleSchema =
  DoctorScheduleFieldsSchema.superRefine((v, ctx) =>
    assertStartBeforeEnd(v, ctx),
  );

export class CreateDoctorScheduleDto extends createZodDto(
  CreateDoctorScheduleSchema,
) {}

export const UpdateDoctorScheduleSchema =
  DoctorScheduleFieldsSchema.partial().superRefine((v, ctx) =>
    assertStartBeforeEnd(v, ctx),
  );

export class UpdateDoctorScheduleDto extends createZodDto(
  UpdateDoctorScheduleSchema,
) {}

export const SetDoctorScheduleActiveSchema = z.object({
  isActive: z.boolean(),
});

export class SetDoctorScheduleActiveDto extends createZodDto(
  SetDoctorScheduleActiveSchema,
) {}
