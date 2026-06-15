import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AddAllergySchema = z.object({
  allergenType: z.enum(['DRUG', 'FOOD', 'ENVIRONMENTAL', 'OTHER']),
  allergenName: z.string().min(1).max(100),
  severity: z.enum(['MILD', 'MODERATE', 'SEVERE', 'FATAL']),
  reaction: z.string().max(200).optional(),
});

export class AddAllergyDto extends createZodDto(AddAllergySchema) {}
