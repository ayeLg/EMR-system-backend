import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ServiceResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'CONSULT_OPD' })
  code!: string;

  @ApiProperty({ example: 'OPD Consultation' })
  name!: string;

  @ApiProperty({ example: 'Consultation' })
  category!: string;

  @ApiProperty({ example: 30000 })
  price!: number;

  @ApiProperty({ example: 0 })
  taxRate!: number;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiPropertyOptional()
  description?: string | null;
}
