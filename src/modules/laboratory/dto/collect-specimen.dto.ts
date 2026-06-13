import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CollectSpecimenSchema = z.object({
  specimenBarcode: z.string().min(1).max(50).optional(),
});

export class CollectSpecimenDto extends createZodDto(CollectSpecimenSchema) {}
