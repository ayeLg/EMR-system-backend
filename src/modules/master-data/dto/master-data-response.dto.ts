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

export class ServiceResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'CONSULT_OPD' })
  code!: string;

  @ApiProperty({ example: 'OPD Consultation' })
  name!: string;

  @ApiProperty({ example: 'Consultation' })
  category!: string;

  @ApiProperty({ example: 30000 })
  price!: number;

  @ApiProperty({ example: 0 })
  taxRate!: number;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiPropertyOptional()
  description?: string | null;
}

export class MedicationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'MED-PARA' })
  code!: string;

  @ApiProperty({ example: 'Paracetamol' })
  genericName!: string;

  @ApiPropertyOptional()
  brandName?: string | null;

  @ApiProperty({ example: 'Analgesic' })
  category!: string;

  @ApiProperty({ example: 'Tablet' })
  dosageForm!: string;

  @ApiProperty({ example: '500mg' })
  strength!: string;

  @ApiProperty({ example: 'tablet' })
  unit!: string;

  @ApiProperty({ example: true })
  isActive!: boolean;
}

export class LabTestResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'CBC' })
  code!: string;

  @ApiProperty({ example: 'Complete Blood Count' })
  name!: string;

  @ApiProperty({ example: 'Hematology' })
  category!: string;

  @ApiProperty({ example: 'Blood' })
  sampleType!: string;

  @ApiProperty({ example: 15000 })
  price!: number;

  @ApiProperty({ example: 24 })
  turnaroundHours!: number;

  @ApiProperty({ example: true })
  isActive!: boolean;
}

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

export class InsuranceProviderResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'AYA' })
  code!: string;

  @ApiProperty({ example: 'AYA SOMPO' })
  name!: string;

  @ApiPropertyOptional({ example: '01-555111' })
  contact?: string | null;

  @ApiProperty({ example: true })
  isActive!: boolean;
}

export class DeleteMasterDataResponseDto {
  @ApiProperty({ example: true })
  deleted!: boolean;
}
