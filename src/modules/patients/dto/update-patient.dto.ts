import { createZodDto } from 'nestjs-zod';
import { CreatePatientSchema } from '@/modules/patients/dto/create-patient.dto';

export const UpdatePatientSchema = CreatePatientSchema.partial();

export class UpdatePatientDto extends createZodDto(UpdatePatientSchema) {}
