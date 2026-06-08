import { createZodDto } from 'nestjs-zod';
import { CreateAppointmentSchema } from './create-appointment.dto';

export const UpdateAppointmentSchema = CreateAppointmentSchema.partial();

export class UpdateAppointmentDto extends createZodDto(
  UpdateAppointmentSchema,
) {}
