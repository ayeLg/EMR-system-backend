import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CheckPolicies } from '@/common/decorators/check-policies.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { SWAGGER_BEARER_AUTH } from '@/common/swagger/setup-swagger';
import type { User } from '@/modules/users/entities/user.entity';
import {
  readEncounterPolicy,
  updateEncounterPolicy,
} from '@/modules/encounters/policies/encounter.policies';
import { ClinicalDocsService } from './clinical-docs.service';
import {
  CreateClinicalDocDto,
  RecordMarAdministerDto,
} from './dto/clinical-docs.dto';

@ApiTags('clinical-docs')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiForbiddenResponse({ description: 'Insufficient CASL permissions' })
@Controller('clinical-docs')
export class ClinicalDocsController {
  constructor(private readonly clinicalDocsService: ClinicalDocsService) {}

  @CheckPolicies(updateEncounterPolicy())
  @Post()
  @ApiOperation({
    summary: 'Create a clinical document (Referral/Certificate/Discharge)',
  })
  createClinicalDoc(
    @Body() dto: CreateClinicalDocDto,
    @CurrentUser() user: User,
  ) {
    return this.clinicalDocsService.createClinicalDoc(dto, user.id);
  }

  @CheckPolicies(readEncounterPolicy())
  @Get('patient/:patientId')
  @ApiParam({ name: 'patientId', format: 'uuid' })
  @ApiOperation({ summary: 'Get all clinical documents for a patient' })
  getClinicalDocsByPatient(@Param('patientId') patientId: string) {
    return this.clinicalDocsService.getClinicalDocsByPatient(patientId);
  }

  @CheckPolicies(readEncounterPolicy())
  @Get('mar/patient/:patientId')
  @ApiParam({ name: 'patientId', format: 'uuid' })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'YYYY-MM-DD format date',
  })
  @ApiOperation({
    summary: 'Get MAR details (medications & given states) for a patient',
  })
  getMarDetailsByPatient(
    @Param('patientId') patientId: string,
    @Query('date') date?: string,
  ) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return this.clinicalDocsService.getMarDetailsByPatient(
      patientId,
      targetDate,
    );
  }

  @CheckPolicies(updateEncounterPolicy())
  @Post('mar/administer')
  @ApiOperation({
    summary: 'Record a medication administration log (MAR sign-off)',
  })
  administerMedication(
    @Body() dto: RecordMarAdministerDto,
    @CurrentUser() user: User,
  ) {
    return this.clinicalDocsService.administerMedication(dto, user.id);
  }

  @CheckPolicies(readEncounterPolicy())
  @Get('print/prescription/:id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Get prescription print data details' })
  getPrescriptionForPrint(@Param('id') id: string) {
    return this.clinicalDocsService.getPrescriptionForPrint(id);
  }

  @CheckPolicies(readEncounterPolicy())
  @Get('print/invoice/:id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Get invoice print data details' })
  getInvoiceForPrint(@Param('id') id: string) {
    return this.clinicalDocsService.getInvoiceForPrint(id);
  }

  @CheckPolicies(readEncounterPolicy())
  @Get('print/lab-order/:id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Get lab order / result print data details' })
  getLabResultForPrint(@Param('id') id: string) {
    return this.clinicalDocsService.getLabResultForPrint(id);
  }

  @CheckPolicies(readEncounterPolicy())
  @Get('print/patient/:id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Get patient MRN card print details' })
  getPatientForPrint(@Param('id') id: string) {
    return this.clinicalDocsService.getPatientForPrint(id);
  }

  @CheckPolicies(readEncounterPolicy())
  @Get('print/clinical-doc/:id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Get clinical document print details' })
  getClinicalDocForPrint(@Param('id') id: string) {
    return this.clinicalDocsService.getClinicalDocForPrint(id);
  }
}
