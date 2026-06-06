import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MedicationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'MED-PARA' })
  code!: string;

  @ApiProperty({ example: 'Paracetamol' })
  genericName!: string;

  @ApiPropertyOptional()
  brandName?: string | null;

  @ApiProperty({ example: 'Analgesic' })
  category!: string;

  @ApiProperty({ example: 'Tablet' })
  dosageForm!: string;

  @ApiProperty({ example: '500mg' })
  strength!: string;

  @ApiProperty({ example: 'tablet' })
  unit!: string;

  @ApiProperty({ example: true })
  isActive!: boolean;
}
