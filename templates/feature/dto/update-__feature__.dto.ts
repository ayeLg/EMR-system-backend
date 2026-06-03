import { createZodDto } from 'nestjs-zod';
import { Create__Feature__Schema } from './create-__feature__.dto';

export const Update__Feature__Schema = Create__Feature__Schema.partial();

export class Update__Feature__Dto extends createZodDto(
  Update__Feature__Schema,
) {}
