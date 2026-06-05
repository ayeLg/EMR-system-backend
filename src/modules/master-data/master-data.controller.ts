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
  CreateDepartmentDto,
  CreateInsuranceProviderDto,
  CreateLabTestDto,
  CreateMedicationDto,
  CreateServiceDto,
  CreateWardDto,
  SetIsActiveDto,
  UpdateDepartmentDto,
  UpdateInsuranceProviderDto,
  UpdateLabTestDto,
  UpdateMedicationDto,
  UpdateServiceDto,
  UpdateWardDto,
} from './dto/master-data.dto';
import {
  DeleteMasterDataResponseDto,
  DepartmentResponseDto,
  InsuranceProviderResponseDto,
  LabTestResponseDto,
  MedicationResponseDto,
  ServiceResponseDto,
  WardResponseDto,
} from './dto/master-data-response.dto';
import { DepartmentsService } from './departments.service';
import { InsuranceProvidersService } from './insurance-providers.service';
import { LabTestsService } from './lab-tests.service';
import { MedicationsService } from './medications.service';
import {
  manageMasterDataPolicy,
  readMasterDataPolicy,
} from './policies/master-data.policies';
import { ServicesCatalogService } from './services-catalog.service';
import { WardsService } from './wards.service';

@ApiTags('master-data')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiForbiddenResponse({ description: 'Insufficient CASL permissions' })
@Controller('master-data')
export class MasterDataController {
  constructor(
    private readonly departments: DepartmentsService,
    private readonly services: ServicesCatalogService,
    private readonly medications: MedicationsService,
    private readonly labTests: LabTestsService,
    private readonly wards: WardsService,
    private readonly insuranceProviders: InsuranceProvidersService,
  ) {}

  @CheckPolicies(readMasterDataPolicy())
  @Get('departments')
  @ApiOperation({ summary: 'List departments' })
  @ApiOkResponseData(DepartmentResponseDto, { isArray: true })
  listDepartments(): Promise<DepartmentResponseDto[]> {
    return this.departments.findAll();
  }

  @CheckPolicies(readMasterDataPolicy())
  @Get('departments/:id')
  @ApiOperation({ summary: 'Get department by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponseData(DepartmentResponseDto)
  @ApiNotFoundResponse()
  getDepartment(@Param('id') id: string): Promise<DepartmentResponseDto> {
    return this.departments.findOne(id);
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Post('departments')
  @ApiOperation({ summary: 'Create department' })
  @ApiCreatedResponseData(DepartmentResponseDto)
  createDepartment(
    @Body() dto: CreateDepartmentDto,
  ): Promise<DepartmentResponseDto> {
    return this.departments.create(dto);
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Patch('departments/:id/is-active')
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
  @Patch('departments/:id')
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
  @Delete('departments/:id')
  @ApiOperation({ summary: 'Delete department' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponseData(DeleteMasterDataResponseDto)
  @ApiNotFoundResponse()
  removeDepartment(@Param('id') id: string) {
    return this.departments.remove(id);
  }

  @CheckPolicies(readMasterDataPolicy())
  @Get('services')
  @ApiOperation({ summary: 'List billable services' })
  @ApiOkResponseData(ServiceResponseDto, { isArray: true })
  listServices() {
    return this.services.findAll();
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Post('services')
  @ApiOperation({ summary: 'Create service' })
  @ApiCreatedResponseData(ServiceResponseDto)
  createService(@Body() dto: CreateServiceDto) {
    return this.services.create(dto);
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Patch('services/:id')
  @ApiOperation({ summary: 'Update service' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponseData(ServiceResponseDto)
  @ApiNotFoundResponse()
  updateService(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.services.update(id, dto);
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Delete('services/:id')
  @ApiOperation({ summary: 'Delete service' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponseData(DeleteMasterDataResponseDto)
  @ApiNotFoundResponse()
  removeService(@Param('id') id: string) {
    return this.services.remove(id);
  }

  @CheckPolicies(readMasterDataPolicy())
  @Get('medications')
  @ApiOperation({ summary: 'List medications' })
  @ApiOkResponseData(MedicationResponseDto, { isArray: true })
  listMedications() {
    return this.medications.findAll();
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Post('medications')
  @ApiOperation({ summary: 'Create medication' })
  @ApiCreatedResponseData(MedicationResponseDto)
  createMedication(@Body() dto: CreateMedicationDto) {
    return this.medications.create(dto);
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Patch('medications/:id')
  @ApiOperation({ summary: 'Update medication' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponseData(MedicationResponseDto)
  @ApiNotFoundResponse()
  updateMedication(@Param('id') id: string, @Body() dto: UpdateMedicationDto) {
    return this.medications.update(id, dto);
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Delete('medications/:id')
  @ApiOperation({ summary: 'Delete medication' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponseData(DeleteMasterDataResponseDto)
  @ApiNotFoundResponse()
  removeMedication(@Param('id') id: string) {
    return this.medications.remove(id);
  }

  @CheckPolicies(readMasterDataPolicy())
  @Get('lab-tests')
  @ApiOperation({ summary: 'List lab tests' })
  @ApiOkResponseData(LabTestResponseDto, { isArray: true })
  listLabTests() {
    return this.labTests.findAll();
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Post('lab-tests')
  @ApiOperation({ summary: 'Create lab test' })
  @ApiCreatedResponseData(LabTestResponseDto)
  createLabTest(@Body() dto: CreateLabTestDto) {
    return this.labTests.create(dto);
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Patch('lab-tests/:id')
  @ApiOperation({ summary: 'Update lab test' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponseData(LabTestResponseDto)
  @ApiNotFoundResponse()
  updateLabTest(@Param('id') id: string, @Body() dto: UpdateLabTestDto) {
    return this.labTests.update(id, dto);
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Delete('lab-tests/:id')
  @ApiOperation({ summary: 'Delete lab test' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponseData(DeleteMasterDataResponseDto)
  @ApiNotFoundResponse()
  removeLabTest(@Param('id') id: string) {
    return this.labTests.remove(id);
  }

  @CheckPolicies(readMasterDataPolicy())
  @Get('wards')
  @ApiOperation({ summary: 'List wards' })
  @ApiOkResponseData(WardResponseDto, { isArray: true })
  listWards() {
    return this.wards.findAll();
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Post('wards')
  @ApiOperation({ summary: 'Create ward' })
  @ApiCreatedResponseData(WardResponseDto)
  createWard(@Body() dto: CreateWardDto) {
    return this.wards.create(dto);
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Patch('wards/:id')
  @ApiOperation({ summary: 'Update ward' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponseData(WardResponseDto)
  @ApiNotFoundResponse()
  updateWard(@Param('id') id: string, @Body() dto: UpdateWardDto) {
    return this.wards.update(id, dto);
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Delete('wards/:id')
  @ApiOperation({ summary: 'Delete ward' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponseData(DeleteMasterDataResponseDto)
  @ApiNotFoundResponse()
  removeWard(@Param('id') id: string) {
    return this.wards.remove(id);
  }

  @CheckPolicies(readMasterDataPolicy())
  @Get('insurance-providers')
  @ApiOperation({ summary: 'List insurance providers' })
  @ApiOkResponseData(InsuranceProviderResponseDto, { isArray: true })
  listInsuranceProviders() {
    return this.insuranceProviders.findAll();
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Post('insurance-providers')
  @ApiOperation({ summary: 'Create insurance provider' })
  @ApiCreatedResponseData(InsuranceProviderResponseDto)
  createInsuranceProvider(@Body() dto: CreateInsuranceProviderDto) {
    return this.insuranceProviders.create(dto);
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Patch('insurance-providers/:id')
  @ApiOperation({ summary: 'Update insurance provider' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponseData(InsuranceProviderResponseDto)
  @ApiNotFoundResponse()
  updateInsuranceProvider(
    @Param('id') id: string,
    @Body() dto: UpdateInsuranceProviderDto,
  ) {
    return this.insuranceProviders.update(id, dto);
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Delete('insurance-providers/:id')
  @ApiOperation({ summary: 'Delete insurance provider' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponseData(DeleteMasterDataResponseDto)
  @ApiNotFoundResponse()
  removeInsuranceProvider(@Param('id') id: string) {
    return this.insuranceProviders.remove(id);
  }
}
