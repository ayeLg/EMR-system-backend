import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateAppointmentSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  departmentId: z.string().uuid(),
  scheduledAt: z.iso.datetime(),
  durationMinutes: z.number().int().positive().optional(),
  type: z.enum(['OPD', 'IPD', 'FOLLOWUP', 'EMERGENCY', 'TELECONSULT']),
  chiefComplaint: z.string().optional(),
  notes: z.string().optional(),
});

export class CreateAppointmentDto extends createZodDto(
  CreateAppointmentSchema,
) {}
