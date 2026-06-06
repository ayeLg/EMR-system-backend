import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InsuranceProviderResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'AYA' })
  code!: string;

  @ApiProperty({ example: 'AYA SOMPO' })
  name!: string;

  @ApiPropertyOptional({ example: '01-555111' })
  contact?: string | null;

  @ApiProperty({ example: true })
  isActive!: boolean;
}
