import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const RecordEncounterVitalsSchema = z.object({
  systolicBp: z.number().int().positive().optional(),
  diastolicBp: z.number().int().positive().optional(),
  heartRate: z.number().int().positive().optional(),
  respiratoryRate: z.number().int().positive().optional(),
  temperature: z.number().optional(),
  oxygenSaturation: z.number().optional(),
  weightKg: z.number().positive().optional(),
  heightCm: z.number().positive().optional(),
  painScore: z.number().int().min(0).max(10).optional(),
  notes: z.string().optional(),
});

export class RecordEncounterVitalsDto extends createZodDto(
  RecordEncounterVitalsSchema,
) {}

export const CreateSoapNoteSchema = z.object({
  subjective: z.string().min(10),
  objective: z.string().min(10),
  assessment: z.string().min(10),
  plan: z.string().min(10),
  amendedFrom: z.string().uuid().optional(),
});

export class CreateSoapNoteDto extends createZodDto(CreateSoapNoteSchema) {}

export const AddDiagnosisSchema = z.object({
  icd10Code: z.string().min(3).max(10),
  description: z.string().min(1),
  type: z.enum(['PRIMARY', 'SECONDARY', 'COMPLICATION', 'COMORBIDITY']),
  status: z
    .enum(['ACTIVE', 'RESOLVED', 'CHRONIC', 'SUSPECTED', 'RULED_OUT'])
    .optional(),
  notes: z.string().optional(),
});

export class AddDiagnosisDto extends createZodDto(AddDiagnosisSchema) {}

export const CreatePrescriptionSchema = z.object({
  medicationId: z.string().uuid(),
  dose: z.string().min(1).max(50),
  route: z.enum([
    'ORAL',
    'IV',
    'IM',
    'SC',
    'TOPICAL',
    'INHALED',
    'SUBLINGUAL',
    'RECTAL',
    'NASAL',
    'OPHTHALMIC',
    'OTIC',
    'OTHER',
  ]),
  frequency: z.string().min(1).max(50),
  durationDays: z.number().int().positive().optional(),
  quantityPrescribed: z.number().int().positive(),
  instructions: z.string().optional(),
  overrideReason: z.string().min(5).optional(),
  notes: z.string().optional(),
});

export class CreatePrescriptionDto extends createZodDto(
  CreatePrescriptionSchema,
) {}

export const CreateLabOrderSchema = z.object({
  labTestIds: z.array(z.string().uuid()).min(1),
  priority: z.enum(['STAT', 'URGENT', 'ROUTINE']).optional(),
  clinicalNotes: z.string().optional(),
});

export class CreateLabOrderDto extends createZodDto(CreateLabOrderSchema) {}

export const CreateMedicalOrderSchema = z.object({
  orderType: z.enum(['RADIOLOGY', 'DIET', 'NURSING', 'REFERRAL']),
  priority: z.enum(['STAT', 'URGENT', 'ROUTINE']).optional(),
  description: z.string().min(1),
  details: z.record(z.string(), z.unknown()).optional(),
  notes: z.string().optional(),
});

export class CreateMedicalOrderDto extends createZodDto(
  CreateMedicalOrderSchema,
) {}

export const UpdateEncounterStatusSchema = z.object({
  status: z.enum(['COMPLETED', 'CANCELLED']),
});

export class UpdateEncounterStatusDto extends createZodDto(
  UpdateEncounterStatusSchema,
) {}
