import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AdmitPatientSchema = z.object({
  patientId: z.string().uuid(),
  wardId: z.string().uuid(),
  bedNumber: z.string().min(1).max(10),
  admissionDate: z.string().datetime(),
  attendingDoctorId: z.string().uuid(),
  diagnosis: z.string().min(1),
  icd10Code: z.string().min(3).max(10).optional(),
});

export class AdmitPatientDto extends createZodDto(AdmitPatientSchema) {}

export const DischargePatientSchema = z.object({
  dischargeSummary: z.string().min(10),
  dischargeDate: z.string().datetime(),
});

export class DischargePatientDto extends createZodDto(DischargePatientSchema) {}

export const CreateProgressNoteSchema = z.object({
  content: z.string().min(1),
});

export class CreateProgressNoteDto extends createZodDto(
  CreateProgressNoteSchema,
) {}
