import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const DispensePrescriptionSchema = z.object({
  coSignObtained: z.boolean().optional(),
  ackModerate: z.boolean().optional(),
  overrideReason: z.string().optional(),
});

export class DispensePrescriptionDto extends createZodDto(
  DispensePrescriptionSchema,
) {}
