import { IsString, MinLength } from 'class-validator';

export class Create__Feature__Dto {
  @IsString()
  @MinLength(1)
  name: string;
}
