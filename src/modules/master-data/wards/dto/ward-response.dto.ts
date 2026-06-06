import { ApiProperty } from '@nestjs/swagger';

export class WardResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'WARD-A' })
  code!: string;

  @ApiProperty({ example: 'Ward A (General)' })
  name!: string;

  @ApiProperty({ format: 'uuid' })
  departmentId!: string;

  @ApiProperty({ example: 'General Medicine' })
  department!: string;

  @ApiProperty({ example: 24 })
  totalBeds!: number;

  @ApiProperty({ example: true })
  isActive!: boolean;
}
