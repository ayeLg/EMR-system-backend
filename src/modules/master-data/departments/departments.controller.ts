import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CheckPolicies } from '@/common/decorators/check-policies.decorator';
import {
  ApiCreatedResponseData,
  ApiOkResponseData,
} from '@/common/swagger/api-response.decorator';
import { SWAGGER_BEARER_AUTH } from '@/common/swagger/setup-swagger';
import {
  manageMasterDataPolicy,
  readMasterDataPolicy,
} from '@/authorization/policies/master-data.policies';
import { DeleteMasterDataResponseDto } from '@/common/catalog/delete-response.dto';
import { DepartmentsService } from './departments.service';
import {
  CreateDepartmentDto,
  SetIsActiveDto,
  UpdateDepartmentDto,
} from './dto/department.dto';
import { DepartmentResponseDto } from './dto/department-response.dto';

@ApiTags('departments')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiForbiddenResponse({ description: 'Insufficient CASL permissions' })
@Controller('master-data/departments')
export class DepartmentsController {
  constructor(private readonly departments: DepartmentsService) {}

  @CheckPolicies(readMasterDataPolicy())
  @Get()
  @ApiOperation({ summary: 'List departments' })
  @ApiOkResponseData(DepartmentResponseDto, { isArray: true })
  listDepartments(): Promise<DepartmentResponseDto[]> {
    return this.departments.findAll();
  }

  @CheckPolicies(readMasterDataPolicy())
  @Get(':id')
  @ApiOperation({ summary: 'Get department by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponseData(DepartmentResponseDto)
  @ApiNotFoundResponse()
  getDepartment(@Param('id') id: string): Promise<DepartmentResponseDto> {
    return this.departments.findOne(id);
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Post()
  @ApiOperation({ summary: 'Create department' })
  @ApiCreatedResponseData(DepartmentResponseDto)
  createDepartment(
    @Body() dto: CreateDepartmentDto,
  ): Promise<DepartmentResponseDto> {
    return this.departments.create(dto);
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Patch(':id/is-active')
  @ApiOperation({ summary: 'Set department active status' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: SetIsActiveDto })
  @ApiOkResponseData(DepartmentResponseDto)
  @ApiNotFoundResponse()
  setDepartmentIsActive(
    @Param('id') id: string,
    @Body() dto: SetIsActiveDto,
  ): Promise<DepartmentResponseDto> {
    return this.departments.setIsActive(id, dto.isActive);
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Patch(':id')
  @ApiOperation({ summary: 'Update department' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponseData(DepartmentResponseDto)
  @ApiNotFoundResponse()
  updateDepartment(
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
  ): Promise<DepartmentResponseDto> {
    return this.departments.update(id, dto);
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Delete(':id')
  @ApiOperation({ summary: 'Delete department' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponseData(DeleteMasterDataResponseDto)
  @ApiNotFoundResponse()
  removeDepartment(@Param('id') id: string) {
    return this.departments.remove(id);
  }
}
