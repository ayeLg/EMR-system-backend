import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateServiceSchema = z.object({
  code: z.string().min(1).max(30),
  name: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  price: z.coerce.number().nonnegative(),
  taxRate: z.coerce.number().min(0).max(100).optional(),
  description: z.string().optional(),
});

export class CreateServiceDto extends createZodDto(CreateServiceSchema) {}
export class UpdateServiceDto extends createZodDto(
  CreateServiceSchema.partial(),
) {}
