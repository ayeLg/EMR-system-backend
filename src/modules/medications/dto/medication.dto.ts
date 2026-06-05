import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateMedicationSchema = z.object({
  code: z.string().min(1).max(30),
  genericName: z.string().min(1).max(200),
  brandName: z.string().max(200).optional(),
  category: z.string().max(100).optional(),
  dosageForm: z.string().min(1).max(50),
  strength: z.string().min(1).max(50),
  unit: z.string().min(1).max(20),
});

export class CreateMedicationDto extends createZodDto(CreateMedicationSchema) {}
export class UpdateMedicationDto extends createZodDto(
  CreateMedicationSchema.partial(),
) {}
