import { ApiProperty } from '@nestjs/swagger';

export class LabTestResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'CBC' })
  code!: string;

  @ApiProperty({ example: 'Complete Blood Count' })
  name!: string;

  @ApiProperty({ example: 'Hematology' })
  category!: string;

  @ApiProperty({ example: 'Blood' })
  sampleType!: string;

  @ApiProperty({ example: 15000 })
  price!: number;

  @ApiProperty({ example: 24 })
  turnaroundHours!: number;

  @ApiProperty({ example: true })
  isActive!: boolean;
}
