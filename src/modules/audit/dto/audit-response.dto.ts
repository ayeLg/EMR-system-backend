import { ApiProperty } from '@nestjs/swagger';

export class AuditResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: '2026-06-07T09:00:00.000Z' })
  time!: Date;

  @ApiProperty({ example: 'Dr. Aung Aung' })
  user!: string;

  @ApiProperty({ example: 'CREATE' })
  action!: string;

  @ApiProperty({ example: 'Patient' })
  module!: string;

  @ApiProperty({ example: 'MRN-0100043' })
  resource!: string;

  @ApiProperty({ example: '10.0.0.5' })
  ip!: string;
}
