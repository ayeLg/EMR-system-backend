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
import { CreatePatientDto } from './dto/create-patient.dto';
import { AddAllergyDto } from './dto/add-allergy.dto';
import {
  DeletePatientResponseDto,
  PatientAllergyDto,
  PatientDetailResponseDto,
  PatientResponseDto,
} from './dto/patient-response.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import {
  createPatientPolicy,
  deletePatientPolicy,
  readPatientPolicy,
  updatePatientPolicy,
} from './policies/patient.policies';
import { PatientsService } from './patients.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { User } from '@/modules/users/entities/user.entity';

@ApiTags('patients')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiForbiddenResponse({ description: 'Insufficient CASL permissions' })
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @CheckPolicies(readPatientPolicy())
  @Get()
  @ApiOperation({ summary: 'List all patients' })
  @ApiOkResponseData(PatientResponseDto, { isArray: true })
  findAll(): Promise<PatientResponseDto[]> {
    return this.patientsService.findAll();
  }

  @CheckPolicies(readPatientPolicy())
  @Get(':id')
  @ApiOperation({ summary: 'Get patient by ID' })
  @ApiParam({ name: 'id', example: 'p1' })
  @ApiOkResponseData(PatientDetailResponseDto)
  @ApiNotFoundResponse()
  findOne(@Param('id') id: string): Promise<PatientDetailResponseDto> {
    return this.patientsService.findOne(id);
  }

  @CheckPolicies(createPatientPolicy())
  @Post()
  @ApiOperation({ summary: 'Create a patient' })
  @ApiCreatedResponseData(PatientResponseDto)
  create(
    @Body() dto: CreatePatientDto,
    @CurrentUser() user: User,
  ): Promise<PatientResponseDto> {
    return this.patientsService.create(dto, user.id);
  }

  @CheckPolicies(updatePatientPolicy())
  @Patch(':id')
  @ApiOperation({ summary: 'Update a patient' })
  @ApiParam({ name: 'id', example: 'p1' })
  @ApiOkResponseData(PatientResponseDto)
  @ApiNotFoundResponse()
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePatientDto,
  ): Promise<PatientResponseDto> {
    return this.patientsService.update(id, dto);
  }

  @CheckPolicies(deletePatientPolicy())
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a patient' })
  @ApiParam({ name: 'id', example: 'p1' })
  @ApiOkResponseData(DeletePatientResponseDto)
  @ApiNotFoundResponse()
  async remove(@Param('id') id: string): Promise<DeletePatientResponseDto> {
    await this.patientsService.remove(id);
    return { deleted: true };
  }

  @CheckPolicies(updatePatientPolicy())
  @Post(':id/allergies')
  @ApiOperation({ summary: 'Add an allergy to a patient' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponseData(PatientAllergyDto)
  addAllergy(
    @Param('id') id: string,
    @Body() dto: AddAllergyDto,
    @CurrentUser() user: User,
  ): Promise<PatientAllergyDto> {
    return this.patientsService.addAllergy(id, dto, user.id);
  }
}
