import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { CheckPolicies } from '@/common/decorators/check-policies.decorator';
import {
  ApiCreatedResponseData,
  ApiOkResponseData,
} from '@/common/swagger/api-response.decorator';
import { SWAGGER_BEARER_AUTH } from '@/common/swagger/setup-swagger';
import { RbacService } from '@/authorization/rbac/rbac.service';
import { manageMasterDataPolicy } from '@/authorization/policies/master-data.policies';
import { CreateRoleDto, UpdateRoleDto } from './dto/rbac.dto';
import {
  DeleteRoleResponseDto,
  PermissionResponseDto,
  RoleWithPermissionsResponseDto,
} from './dto/rbac-response.dto';

const SetRolePermissionsSchema = z.object({
  permissionIds: z.array(z.uuid()),
});

class SetRolePermissionsDto extends createZodDto(SetRolePermissionsSchema) {}

@ApiTags('rbac')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@ApiUnauthorizedResponse()
@ApiForbiddenResponse()
@Controller('rbac')
export class RbacController {
  constructor(private readonly rbac: RbacService) {}

  @CheckPolicies(manageMasterDataPolicy())
  @Get('permissions')
  @ApiOperation({ summary: 'List all permission definitions' })
  @ApiOkResponseData(PermissionResponseDto, { isArray: true })
  listPermissions() {
    return this.rbac.listPermissions();
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Get('roles')
  @ApiOperation({ summary: 'List roles with assigned permissions' })
  @ApiOkResponseData(RoleWithPermissionsResponseDto, { isArray: true })
  listRoles() {
    return this.rbac.listRolesWithPermissions();
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Post('roles')
  @ApiOperation({ summary: 'Create a role' })
  @ApiCreatedResponseData(RoleWithPermissionsResponseDto)
  createRole(@Body() dto: CreateRoleDto) {
    return this.rbac.createRole(dto);
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Patch('roles/:roleId')
  @ApiOperation({ summary: 'Update role name or description' })
  @ApiParam({ name: 'roleId', format: 'uuid' })
  @ApiOkResponseData(RoleWithPermissionsResponseDto)
  @ApiNotFoundResponse()
  updateRole(@Param('roleId') roleId: string, @Body() dto: UpdateRoleDto) {
    return this.rbac.updateRole(roleId, dto);
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Delete('roles/:roleId')
  @ApiOperation({ summary: 'Delete a role (must have no users)' })
  @ApiParam({ name: 'roleId', format: 'uuid' })
  @ApiOkResponseData(DeleteRoleResponseDto)
  @ApiNotFoundResponse()
  deleteRole(@Param('roleId') roleId: string) {
    return this.rbac.deleteRole(roleId);
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Put('roles/:roleId/permissions')
  @ApiOperation({ summary: 'Replace permissions assigned to a role' })
  @ApiParam({ name: 'roleId', format: 'uuid' })
  @ApiOkResponseData(RoleWithPermissionsResponseDto)
  @ApiNotFoundResponse()
  setRolePermissions(
    @Param('roleId') roleId: string,
    @Body() dto: SetRolePermissionsDto,
  ) {
    return this.rbac.setRolePermissions(roleId, dto.permissionIds);
  }
}
