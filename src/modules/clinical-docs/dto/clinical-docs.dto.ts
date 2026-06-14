import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateClinicalDocSchema = z.object({
  encounterId: z.string().uuid(),
  noteType: z.enum(['REFERRAL', 'CERTIFICATE', 'DISCHARGE']),
  content: z.record(z.string(), z.any()), // Form values from the frontend
});

export class CreateClinicalDocDto extends createZodDto(
  CreateClinicalDocSchema,
) {}

export const RecordMarAdministerSchema = z.object({
  encounterId: z.string().uuid(),
  prescriptionItemId: z.string().uuid(),
  medicationName: z.string().min(1),
  slot: z.enum(['08:00', '14:00', '20:00']),
  adminDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // 'YYYY-MM-DD'
});

export class RecordMarAdministerDto extends createZodDto(
  RecordMarAdministerSchema,
) {}
