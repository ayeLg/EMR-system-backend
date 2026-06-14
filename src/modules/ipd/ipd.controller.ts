import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiParam,
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
import { IpdService } from './ipd.service';
import {
  AdmitPatientDto,
  DischargePatientDto,
  CreateProgressNoteDto,
} from './dto/ipd.dto';

@ApiTags('ipd')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiForbiddenResponse({ description: 'Insufficient CASL permissions' })
@Controller('ipd')
export class IpdController {
  constructor(private readonly ipdService: IpdService) {}

  @CheckPolicies(readEncounterPolicy())
  @Get('wards')
  @ApiOperation({ summary: 'Get IPD ward occupancy status' })
  getWardOccupancy() {
    return this.ipdService.getWardOccupancy();
  }

  @CheckPolicies(readEncounterPolicy())
  @Get('inpatients')
  @ApiOperation({ summary: 'List currently admitted patients' })
  getInpatients() {
    return this.ipdService.getInpatients();
  }

  @CheckPolicies(updateEncounterPolicy())
  @Post('admissions')
  @ApiOperation({ summary: 'Admit a patient to a ward and bed' })
  admitPatient(@Body() dto: AdmitPatientDto, @CurrentUser() user: User) {
    return this.ipdService.admitPatient(dto, user.id);
  }

  @CheckPolicies(updateEncounterPolicy())
  @Post('admissions/:id/discharge')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Discharge a patient from the hospital' })
  dischargePatient(
    @Param('id') id: string,
    @Body() dto: DischargePatientDto,
    @CurrentUser() user: User,
  ) {
    return this.ipdService.dischargePatient(id, dto, user.id);
  }

  @CheckPolicies(updateEncounterPolicy())
  @Post('admissions/:id/notes')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Add a daily progress note for a patient' })
  addProgressNote(
    @Param('id') id: string,
    @Body() dto: CreateProgressNoteDto,
    @CurrentUser() user: User,
  ) {
    return this.ipdService.addProgressNote(id, dto, user.id);
  }
}
