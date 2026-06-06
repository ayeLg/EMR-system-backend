import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PermissionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'patient' })
  module!: string;

  @ApiProperty({ example: 'read' })
  action!: string;

  @ApiProperty({ example: 'Patient' })
  resource!: string;

  @ApiProperty({ example: 'patient:read' })
  key!: string;
}

export class RolePermissionItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'patient:read' })
  key!: string;

  @ApiProperty()
  module!: string;

  @ApiProperty()
  action!: string;

  @ApiProperty()
  resource!: string;
}

export class RoleWithPermissionsResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'DOCTOR' })
  code!: string;

  @ApiProperty({ example: 'Doctor' })
  name!: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty({ example: 12 })
  userCount!: number;

  @ApiProperty({ type: [RolePermissionItemDto] })
  permissions!: RolePermissionItemDto[];
}

export class DeleteRoleResponseDto {
  @ApiProperty({ example: true })
  deleted!: boolean;
}
