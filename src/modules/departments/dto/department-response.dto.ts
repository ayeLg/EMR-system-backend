import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DepartmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'CARDIO' })
  code!: string;

  @ApiProperty({ example: 'Cardiology' })
  name!: string;

  @ApiPropertyOptional({ example: 'Heart & vascular' })
  description?: string | null;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
