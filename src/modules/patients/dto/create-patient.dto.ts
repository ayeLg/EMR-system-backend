import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreatePatientSchema = z.object({
  // MRN is auto-generated server-side (`MRN-` + 7-digit sequence), never client-supplied.
  firstName: z.string().min(1).max(100).meta({ example: 'Jane' }),
  lastName: z.string().min(1).max(100).meta({ example: 'Doe' }),
  dateOfBirth: z.iso.date().meta({ example: '1990-01-01' }),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).meta({ example: 'FEMALE' }),
  nrcNumber: z.string().max(30).optional(),
  bloodType: z
    .enum([
      'A_POS',
      'A_NEG',
      'B_POS',
      'B_NEG',
      'O_POS',
      'O_NEG',
      'AB_POS',
      'AB_NEG',
      'UNKNOWN',
    ])
    .optional(),
  primaryPhone: z.string().min(1).max(20),
  secondaryPhone: z.string().min(1).max(20).optional(),
  email: z.string().email().max(150).optional(),
  address: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  township: z.string().max(100).optional(),
});

export class CreatePatientDto extends createZodDto(CreatePatientSchema) {}
