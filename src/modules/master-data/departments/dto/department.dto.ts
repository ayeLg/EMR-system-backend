import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateDepartmentSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

export class CreateDepartmentDto extends createZodDto(CreateDepartmentSchema) {}

export const UpdateDepartmentSchema = CreateDepartmentSchema.partial();
export class UpdateDepartmentDto extends createZodDto(UpdateDepartmentSchema) {}

export const SetIsActiveSchema = z.object({
  isActive: z.boolean(),
});

export class SetIsActiveDto extends createZodDto(SetIsActiveSchema) {}
