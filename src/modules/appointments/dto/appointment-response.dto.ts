import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AppointmentResponseDto {
  @ApiProperty({ example: '2f082adc-1369-4ba1-86c3-23db26dbb245' })
  id!: string;

  @ApiProperty({ example: 'APT-LX3Z9AB1-C4F2' })
  appointmentNo!: string;

  @ApiProperty({ example: 'Aung Min' })
  patientName!: string;

  @ApiProperty({ example: 'MRN-0000001' })
  mrn!: string;

  @ApiProperty({ example: 'Dr. Jane Doe' })
  doctorName!: string;

  @ApiProperty({ example: 'General Medicine' })
  department!: string;

  @ApiProperty({ example: '2026-06-08T09:30:00.000Z' })
  scheduledAt!: string;

  @ApiProperty({
    enum: ['OPD', 'IPD', 'FOLLOWUP', 'EMERGENCY', 'TELECONSULT'],
    example: 'OPD',
  })
  type!: string;

  @ApiProperty({
    enum: [
      'SCHEDULED',
      'ARRIVED',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED',
      'NO_SHOW',
    ],
    example: 'SCHEDULED',
  })
  status!: string;

  @ApiPropertyOptional({ example: 'Chest pain' })
  chiefComplaint?: string;
}

export class DeleteAppointmentResponseDto {
  @ApiProperty({ example: true })
  deleted!: boolean;
}
