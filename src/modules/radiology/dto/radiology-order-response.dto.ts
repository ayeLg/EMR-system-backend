import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderPriority, OrderStatus } from '@prisma/client';

export class RadiologyDetailsDto {
  @ApiProperty()
  findings!: string;

  @ApiProperty()
  impression!: string;

  @ApiPropertyOptional()
  imagingUrl?: string;

  @ApiProperty()
  performedBy!: string;

  @ApiProperty()
  performedAt!: string;
}

export class RadiologyOrderResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  encounterId!: string;

  @ApiProperty()
  patientName!: string;

  @ApiProperty()
  mrn!: string;

  @ApiProperty()
  orderedBy!: string;

  @ApiProperty()
  orderedAt!: string;

  @ApiProperty({ enum: OrderPriority })
  priority!: OrderPriority;

  @ApiProperty({ enum: OrderStatus })
  status!: OrderStatus;

  @ApiProperty()
  description!: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiPropertyOptional()
  completedAt?: string;

  @ApiPropertyOptional({ type: RadiologyDetailsDto })
  details?: RadiologyDetailsDto;
}
