import { IsOptional, IsString, MinLength } from 'class-validator';

export class Update__Feature__Dto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;
}
