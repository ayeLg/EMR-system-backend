import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@/authorization/roles/role.enum';

export class UserResponseDto {
  @ApiProperty({ example: '2' })
  id!: string;

  @ApiProperty({ example: 'doctor@example.com' })
  email!: string;

  @ApiProperty({ example: 'Dr. Jane Doe' })
  fullName!: string;

  @ApiProperty({ enum: Role, example: Role.Doctor })
  role!: Role;

  @ApiProperty({ example: 'DOCTOR', description: 'Database role code' })
  roleCode!: string;

  @ApiProperty({
    example: ['patient:read', 'patient:create'],
    description: 'Permission keys for UI RBAC',
  })
  permissions!: string[];

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
