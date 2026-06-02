import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePatientDto {
  @ApiProperty({ example: 'MRN-002' })
  @IsString()
  @MinLength(1)
  mrn: string;

  @ApiProperty({ example: 'Jane' })
  @IsString()
  @MinLength(1)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(1)
  lastName: string;

  @ApiProperty({ example: '1990-01-01' })
  @IsDateString()
  dateOfBirth: string;

  @ApiPropertyOptional({ example: '2' })
  @IsOptional()
  @IsString()
  assignedDoctorId?: string;
}
