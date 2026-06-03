import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const Create__Feature__Schema = z.object({
  name: z.string().min(1).meta({ example: '__Feature__ name' }),
});

export class Create__Feature__Dto extends createZodDto(
  Create__Feature__Schema,
) {}
