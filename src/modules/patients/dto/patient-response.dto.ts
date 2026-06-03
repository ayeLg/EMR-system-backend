import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PatientResponseDto {
  @ApiProperty({ example: 'p1' })
  id!: string;

  @ApiProperty({ example: 'MRN-001' })
  mrn!: string;

  @ApiProperty({ example: 'John' })
  firstName!: string;

  @ApiProperty({ example: 'Smith' })
  lastName!: string;

  @ApiProperty({ example: '1985-03-15' })
  dateOfBirth!: string;

  @ApiPropertyOptional({ example: '2' })
  assignedDoctorId?: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class DeletePatientResponseDto {
  @ApiProperty({ example: true })
  deleted!: boolean;
}
