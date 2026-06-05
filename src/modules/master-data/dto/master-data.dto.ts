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

export const CreateMedicationSchema = z.object({
  code: z.string().min(1).max(30),
  genericName: z.string().min(1).max(200),
  brandName: z.string().max(200).optional(),
  category: z.string().max(100).optional(),
  dosageForm: z.string().min(1).max(50),
  strength: z.string().min(1).max(50),
  unit: z.string().min(1).max(20),
});

export class CreateMedicationDto extends createZodDto(CreateMedicationSchema) {}
export class UpdateMedicationDto extends createZodDto(
  CreateMedicationSchema.partial(),
) {}

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

export const CreateWardSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  departmentId: z.uuid(),
  totalBeds: z.coerce.number().int().positive(),
});

export class CreateWardDto extends createZodDto(CreateWardSchema) {}
export class UpdateWardDto extends createZodDto(CreateWardSchema.partial()) {}

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
