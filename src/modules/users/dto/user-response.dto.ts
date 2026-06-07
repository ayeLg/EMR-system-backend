import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'EMP-0001' })
  employeeId!: string;

  @ApiProperty({ example: 'Dr. Aung Aung' })
  fullName!: string;

  @ApiProperty({ example: 'aung@hospital.mm' })
  email!: string;

  @ApiProperty({ example: 'DOCTOR' })
  role!: string;

  @ApiPropertyOptional({ example: 'Cardiology' })
  department?: string | null;

  @ApiProperty({ enum: UserStatus, example: 'ACTIVE' })
  status!: UserStatus;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
