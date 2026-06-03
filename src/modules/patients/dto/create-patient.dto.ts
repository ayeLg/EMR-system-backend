import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreatePatientSchema = z.object({
  mrn: z.string().min(1).meta({ example: 'MRN-002' }),
  firstName: z.string().min(1).meta({ example: 'Jane' }),
  lastName: z.string().min(1).meta({ example: 'Doe' }),
  dateOfBirth: z.iso.date().meta({ example: '1990-01-01' }),
  assignedDoctorId: z.string().optional().meta({ example: '2' }),
});

export class CreatePatientDto extends createZodDto(CreatePatientSchema) {}
