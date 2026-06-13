import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateInventorySchema = z.object({
  medicationId: z.string().uuid(),
  batchNumber: z.string().min(1),
  expiryDate: z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
    message: 'Invalid expiry date',
  }),
  quantityOnHand: z.number().int().nonnegative(),
  reorderLevel: z.number().int().positive().optional(),
  unitCost: z.number().positive(),
  supplier: z.string().optional(),
});

export class CreateInventoryDto extends createZodDto(CreateInventorySchema) {}

export const UpdateInventorySchema = CreateInventorySchema.partial();

export class UpdateInventoryDto extends createZodDto(UpdateInventorySchema) {}
