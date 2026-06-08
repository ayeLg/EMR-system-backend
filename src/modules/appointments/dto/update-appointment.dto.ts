import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { CreateAppointmentSchema } from './create-appointment.dto';

export const UpdateAppointmentSchema = CreateAppointmentSchema.extend({
  status: z
    .enum([
      'SCHEDULED',
      'ARRIVED',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED',
      'NO_SHOW',
    ])
    .optional(),
  cancelledReason: z.string().optional(),
}).partial();

export class UpdateAppointmentDto extends createZodDto(
  UpdateAppointmentSchema,
) {}
