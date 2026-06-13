import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const SaveResultItemSchema = z.object({
  labOrderItemId: z.string().uuid(),
  value: z.string().min(1),
});

export const SaveLabResultsSchema = z.object({
  results: z.array(SaveResultItemSchema).min(1),
});

export class SaveLabResultsDto extends createZodDto(SaveLabResultsSchema) {}
