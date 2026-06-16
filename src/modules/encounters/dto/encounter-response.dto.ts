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

export class LabOrderItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  labTestId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  code!: string;
}

export class EncounterLabOrderDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  orderNo!: string;

  @ApiProperty()
  priority!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  orderedAt!: string;

  @ApiPropertyOptional()
  clinicalNotes?: string;

  @ApiProperty({ type: LabOrderItemDto, isArray: true })
  items!: LabOrderItemDto[];
}

export class EncounterMedicalOrderDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  orderType!: string;

  @ApiProperty()
  priority!: string;

  @ApiProperty()
  description!: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  orderedAt!: string;
}

export class EncounterSoapNoteDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  subjective!: string;

  @ApiProperty()
  objective!: string;

  @ApiProperty()
  assessment!: string;

  @ApiProperty()
  plan!: string;

  @ApiProperty()
  isAmended!: boolean;

  @ApiPropertyOptional()
  amendedFrom?: string;

  @ApiProperty()
  createdAt!: string;
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

  @ApiProperty({ type: EncounterLabOrderDto, isArray: true })
  labOrders!: EncounterLabOrderDto[];

  @ApiProperty({ type: EncounterMedicalOrderDto, isArray: true })
  medicalOrders!: EncounterMedicalOrderDto[];

  @ApiProperty({ type: EncounterSoapNoteDto, isArray: true })
  soapNotes!: EncounterSoapNoteDto[];
}

export class EncounterWriteResponseDto {
  @ApiProperty()
  id!: string;
}
