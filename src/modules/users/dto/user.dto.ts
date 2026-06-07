import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { UserStatus } from '@prisma/client';

export const CreateUserSchema = z.object({
  fullName: z.string().min(1).max(150),
  employeeId: z.string().max(20).optional(),
  email: z.string().email().max(150),
  role: z.string().min(1).max(50), // Role code (e.g. DOCTOR, NURSE)
  department: z.string().max(100).optional().nullable(), // Department name or code
});

export class CreateUserDto extends createZodDto(CreateUserSchema) {}

export const UpdateUserSchema = CreateUserSchema.partial();
export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}

export const UpdateUserStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});

export class UpdateUserStatusDto extends createZodDto(UpdateUserStatusSchema) {}
