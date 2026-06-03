import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@/roles/role.enum';

export class UserResponseDto {
  @ApiProperty({ example: '2' })
  id!: string;

  @ApiProperty({ example: 'doctor@example.com' })
  email!: string;

  @ApiProperty({ example: 'Dr. Jane Doe' })
  fullName!: string;

  @ApiProperty({ enum: Role, example: Role.Doctor })
  role!: Role;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
