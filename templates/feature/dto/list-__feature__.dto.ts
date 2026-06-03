import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const List__Feature__Schema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
});

export class List__Feature__Dto extends createZodDto(List__Feature__Schema) {}
