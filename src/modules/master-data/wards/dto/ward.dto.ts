import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateWardSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  departmentId: z.uuid(),
  totalBeds: z.coerce.number().int().positive(),
});

export class CreateWardDto extends createZodDto(CreateWardSchema) {}
export class UpdateWardDto extends createZodDto(CreateWardSchema.partial()) {}
