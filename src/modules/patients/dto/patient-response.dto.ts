import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PatientResponseDto {
  @ApiProperty({ example: 'p1' })
  id!: string;

  @ApiProperty({ example: 'MRN-0000001' })
  mrn!: string;

  @ApiProperty({ example: 'John' })
  firstName!: string;

  @ApiProperty({ example: 'Smith' })
  lastName!: string;

  @ApiProperty({ example: '1985-03-15' })
  dateOfBirth!: string;

  @ApiProperty({ example: 'MALE', enum: ['MALE', 'FEMALE', 'OTHER'] })
  gender!: string;

  @ApiPropertyOptional({ example: '12/ABC(N)123456' })
  nrcNumber?: string;

  @ApiProperty({ example: 'O_POS' })
  bloodType!: string;

  @ApiProperty({ example: '09771234567' })
  primaryPhone!: string;

  @ApiPropertyOptional({ example: '09887654321' })
  secondaryPhone?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  email?: string;

  @ApiPropertyOptional({ example: 'No. 42, Pyay Road' })
  address?: string;

  @ApiPropertyOptional({ example: 'Yangon' })
  city?: string;

  @ApiPropertyOptional({ example: 'Sanchaung' })
  township?: string;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class PatientAllergyDto {
  @ApiProperty({ example: 'a1' })
  id!: string;

  @ApiProperty({ example: 'DRUG' })
  allergenType!: string;

  @ApiProperty({ example: 'Penicillin' })
  allergenName!: string;

  @ApiProperty({ example: 'SEVERE' })
  severity!: string;

  @ApiPropertyOptional({ example: 'Anaphylaxis' })
  reaction?: string;
}

export class PatientEncounterSummaryDto {
  @ApiProperty({ example: 'e1' })
  id!: string;

  @ApiProperty({ example: 'ENC-0200102' })
  encounterNo!: string;

  @ApiProperty({ example: '2026-05-20' })
  date!: string;

  @ApiProperty({ example: 'OPD' })
  type!: string;

  @ApiPropertyOptional({ example: 'Dr. Aung Aung' })
  doctor?: string;

  @ApiProperty({ example: 'COMPLETED' })
  status!: string;
}

export class PatientDetailResponseDto extends PatientResponseDto {
  @ApiProperty({ type: [PatientAllergyDto] })
  allergies!: PatientAllergyDto[];

  @ApiProperty({ type: [PatientEncounterSummaryDto] })
  recentEncounters!: PatientEncounterSummaryDto[];
}

export class DeletePatientResponseDto {
  @ApiProperty({ example: true })
  deleted!: boolean;
}
