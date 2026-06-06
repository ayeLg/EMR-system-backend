import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateLabTestSchema = z.object({
  code: z.string().min(1).max(30),
  name: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  sampleType: z.string().min(1).max(50),
  price: z.coerce.number().nonnegative(),
  turnaroundHours: z.coerce.number().int().positive().optional(),
});

export class CreateLabTestDto extends createZodDto(CreateLabTestSchema) {}
export class UpdateLabTestDto extends createZodDto(
  CreateLabTestSchema.partial(),
) {}
