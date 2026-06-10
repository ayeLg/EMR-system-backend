import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const RecordVitalsSchema = z.object({
  systolicBp: z.number().int().min(0).max(300),
  diastolicBp: z.number().int().min(0).max(200),
  heartRate: z.number().int().min(0).max(300),
  respiratoryRate: z.number().int().min(0).max(100),
  temperature: z.number().min(25).max(45),
  oxygenSaturation: z.number().min(0).max(100),
  weightKg: z.number().positive().max(400),
  heightCm: z.number().positive().max(300),
  bmi: z.number().min(0).max(100).optional(),
  painScore: z.number().int().min(0).max(10),
});

export class RecordVitalsDto extends createZodDto(RecordVitalsSchema) {}
