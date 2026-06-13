import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PrescriptionItemDto {
  @ApiProperty()
  medication!: string;

  @ApiProperty()
  dose!: string;

  @ApiProperty()
  route!: string;

  @ApiProperty()
  frequency!: string;

  @ApiProperty()
  quantityPrescribed!: number;

  @ApiPropertyOptional()
  quantityDispensed?: number;
}

export class InteractionDto {
  @ApiProperty()
  drugs!: string;

  @ApiProperty()
  severity!: string;

  @ApiProperty()
  description!: string;
}

export class PrescriptionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  rxNumber!: string;

  @ApiProperty()
  patientName!: string;

  @ApiProperty()
  mrn!: string;

  @ApiProperty()
  prescribedBy!: string;

  @ApiProperty()
  prescribedAt!: string;

  @ApiProperty({
    enum: [
      'PENDING',
      'PARTIALLY_DISPENSED',
      'DISPENSED',
      'CANCELLED',
      'EXPIRED',
    ],
  })
  status!: string;

  @ApiProperty({ enum: ['ROUTINE', 'URGENT', 'STAT'] })
  priority!: string;

  @ApiProperty({ type: PrescriptionItemDto, isArray: true })
  items!: PrescriptionItemDto[];

  @ApiProperty({ type: InteractionDto, isArray: true })
  interactions!: InteractionDto[];
}
