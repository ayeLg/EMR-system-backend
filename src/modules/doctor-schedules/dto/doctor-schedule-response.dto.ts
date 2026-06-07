import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DoctorScheduleResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  doctorId!: string;

  @ApiProperty({ example: 'Dr. Aung Aung' })
  doctorName!: string;

  @ApiProperty({ description: '0=Sun … 6=Sat', example: 1 })
  dayOfWeek!: number;

  @ApiProperty({ example: 'Mon' })
  dayLabel!: string;

  @ApiProperty({ example: '09:00' })
  startTime!: string;

  @ApiProperty({ example: '12:00' })
  endTime!: string;

  @ApiProperty({ example: 15 })
  slotMinutes!: number;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ type: String, format: 'date' })
  validFrom!: Date;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  validUntil!: Date | null;
}

export class DeleteDoctorScheduleResponseDto {
  @ApiProperty({ example: true })
  deleted!: boolean;
}
