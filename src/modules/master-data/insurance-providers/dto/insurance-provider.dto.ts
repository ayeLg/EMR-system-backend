import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateInsuranceProviderSchema = z.object({
  code: z.string().min(1).max(30),
  name: z.string().min(1).max(200),
  contact: z.string().max(100).optional(),
});

export class CreateInsuranceProviderDto extends createZodDto(
  CreateInsuranceProviderSchema,
) {}
export class UpdateInsuranceProviderDto extends createZodDto(
  CreateInsuranceProviderSchema.partial(),
) {}
