import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const SubmitRadiologyResultsSchema = z.object({
  findings: z.string().min(1),
  impression: z.string().min(1),
  imagingUrl: z.string().optional(),
});

export class SubmitRadiologyResultsDto extends createZodDto(
  SubmitRadiologyResultsSchema,
) {}
