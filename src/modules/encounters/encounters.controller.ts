import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CheckPolicies } from '@/common/decorators/check-policies.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import {
  ApiCreatedResponseData,
  ApiOkResponseData,
} from '@/common/swagger/api-response.decorator';
import { SWAGGER_BEARER_AUTH } from '@/common/swagger/setup-swagger';
import type { User } from '@/modules/users/entities/user.entity';
import {
  EncounterDetailResponseDto,
  EncounterResponseDto,
  EncounterWriteResponseDto,
} from './dto/encounter-response.dto';
import {
  AddDiagnosisDto,
  CreateLabOrderDto,
  CreateMedicalOrderDto,
  CreatePrescriptionDto,
  CreateSoapNoteDto,
  RecordEncounterVitalsDto,
  UpdateEncounterStatusDto,
} from './dto/encounter-write.dto';
import { EncountersService } from './encounters.service';
import {
  readEncounterPolicy,
  updateEncounterPolicy,
} from './policies/encounter.policies';

@ApiTags('encounters')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiForbiddenResponse({ description: 'Insufficient CASL permissions' })
@Controller('encounters')
export class EncountersController {
  constructor(private readonly encountersService: EncountersService) {}

  @CheckPolicies(readEncounterPolicy())
  @Get()
  @ApiOperation({ summary: 'List encounters' })
  @ApiOkResponseData(EncounterResponseDto, { isArray: true })
  findAll(): Promise<EncounterResponseDto[]> {
    return this.encountersService.findAll();
  }

  @CheckPolicies(readEncounterPolicy())
  @Get(':id')
  @ApiOperation({ summary: 'Get encounter detail context' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponseData(EncounterDetailResponseDto)
  @ApiNotFoundResponse()
  findOne(@Param('id') id: string): Promise<EncounterDetailResponseDto> {
    return this.encountersService.findOne(id);
  }

  @CheckPolicies(updateEncounterPolicy())
  @Post(':id/vitals')
  @ApiOperation({ summary: 'Record encounter vitals' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponseData(EncounterWriteResponseDto)
  recordVitals(
    @Param('id') id: string,
    @Body() dto: RecordEncounterVitalsDto,
    @CurrentUser() user: User,
  ): Promise<EncounterWriteResponseDto> {
    return this.encountersService.recordVitals(id, dto, user.id);
  }

  @CheckPolicies(updateEncounterPolicy())
  @Post(':id/notes')
  @ApiOperation({ summary: 'Create SOAP note' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponseData(EncounterWriteResponseDto)
  createSoapNote(
    @Param('id') id: string,
    @Body() dto: CreateSoapNoteDto,
    @CurrentUser() user: User,
  ): Promise<EncounterWriteResponseDto> {
    return this.encountersService.createSoapNote(id, dto, user.id);
  }

  @CheckPolicies(updateEncounterPolicy())
  @Post(':id/diagnoses')
  @ApiOperation({ summary: 'Add encounter diagnosis' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponseData(EncounterWriteResponseDto)
  addDiagnosis(
    @Param('id') id: string,
    @Body() dto: AddDiagnosisDto,
    @CurrentUser() user: User,
  ): Promise<EncounterWriteResponseDto> {
    return this.encountersService.addDiagnosis(id, dto, user.id);
  }

  @CheckPolicies(updateEncounterPolicy())
  @Post(':id/prescriptions')
  @ApiOperation({ summary: 'Create prescription with allergy guard' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponseData(EncounterWriteResponseDto)
  createPrescription(
    @Param('id') id: string,
    @Body() dto: CreatePrescriptionDto,
    @CurrentUser() user: User,
  ): Promise<EncounterWriteResponseDto> {
    return this.encountersService.createPrescription(id, dto, user.id);
  }

  @CheckPolicies(updateEncounterPolicy())
  @Post(':id/lab-orders')
  @ApiOperation({ summary: 'Create lab order' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponseData(EncounterWriteResponseDto)
  createLabOrder(
    @Param('id') id: string,
    @Body() dto: CreateLabOrderDto,
    @CurrentUser() user: User,
  ): Promise<EncounterWriteResponseDto> {
    return this.encountersService.createLabOrder(id, dto, user.id);
  }

  @CheckPolicies(updateEncounterPolicy())
  @Post(':id/orders')
  @ApiOperation({ summary: 'Create medical order' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponseData(EncounterWriteResponseDto)
  createMedicalOrder(
    @Param('id') id: string,
    @Body() dto: CreateMedicalOrderDto,
    @CurrentUser() user: User,
  ): Promise<EncounterWriteResponseDto> {
    return this.encountersService.createMedicalOrder(id, dto, user.id);
  }

  @CheckPolicies(updateEncounterPolicy())
  @Patch(':id/status')
  @ApiOperation({ summary: 'Complete or cancel encounter' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponseData(EncounterResponseDto)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateEncounterStatusDto,
    @CurrentUser() user: User,
  ): Promise<EncounterResponseDto> {
    return this.encountersService.updateStatus(id, dto, user);
  }
}
