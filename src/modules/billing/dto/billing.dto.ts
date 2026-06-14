import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const RecordPaymentSchema = z.object({
  amount: z.number().positive(),
  method: z.enum([
    'CASH',
    'CARD',
    'INSURANCE',
    'MOBILE_PAYMENT',
    'BANK_TRANSFER',
    'WAIVER',
  ]),
  referenceNo: z.string().optional(),
  notes: z.string().optional(),
});

export class RecordPaymentDto extends createZodDto(RecordPaymentSchema) {}

export const SubmitClaimSchema = z.object({
  insuranceProvider: z.string().min(1),
  policyNumber: z.string().min(1),
});

export class SubmitClaimDto extends createZodDto(SubmitClaimSchema) {}

export const VoidInvoiceSchema = z.object({
  reason: z.string().min(5),
});

export class VoidInvoiceDto extends createZodDto(VoidInvoiceSchema) {}
