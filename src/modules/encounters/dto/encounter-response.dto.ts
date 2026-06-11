import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EncounterResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  encounterNo!: string;

  @ApiProperty()
  patientName!: string;

  @ApiProperty()
  mrn!: string;

  @ApiProperty()
  doctorName!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  startTime!: string;

  @ApiProperty({ enum: ['OPEN', 'COMPLETED', 'CANCELLED'] })
  status!: string;
}

export class EncounterVitalsDto {
  @ApiPropertyOptional()
  systolicBp?: number;

  @ApiPropertyOptional()
  diastolicBp?: number;

  @ApiPropertyOptional()
  heartRate?: number;

  @ApiPropertyOptional()
  temperature?: number;

  @ApiPropertyOptional()
  oxygenSaturation?: number;

  @ApiPropertyOptional()
  weightKg?: number;

  @ApiProperty()
  recordedAt!: string;
}

export class EncounterDiagnosisDto {
  @ApiProperty()
  icd10Code!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  type!: string;
}

export class EncounterDetailResponseDto extends EncounterResponseDto {
  @ApiProperty({ type: Object, isArray: true })
  allergies!: { allergenName: string; severity: string }[];

  @ApiProperty({ type: Object, isArray: true })
  currentMeds!: { name: string; dose: string }[];

  @ApiProperty({ type: Object, isArray: true })
  problemList!: { icd10Code: string; description: string }[];

  @ApiProperty({ type: Object, isArray: true })
  pastEncounters!: { encounterNo: string; date: string; type: string }[];

  @ApiPropertyOptional({ type: EncounterVitalsDto })
  vitals?: EncounterVitalsDto;

  @ApiProperty({ type: EncounterDiagnosisDto, isArray: true })
  diagnoses!: EncounterDiagnosisDto[];
}

export class EncounterWriteResponseDto {
  @ApiProperty()
  id!: string;
}
