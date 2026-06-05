import { Body, Controller, Get, Param, Put } from '@nestjs/common';
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
import { ApiOkResponseData } from '@/common/swagger/api-response.decorator';
import { SWAGGER_BEARER_AUTH } from '@/common/swagger/setup-swagger';
import { RbacService } from '@/authorization/rbac/rbac.service';
import { manageMasterDataPolicy } from '@/authorization/policies/master-data.policies';
import {
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
