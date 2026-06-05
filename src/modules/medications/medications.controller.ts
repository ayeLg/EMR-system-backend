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
import {
  manageMasterDataPolicy,
  readMasterDataPolicy,
} from '@/authorization/policies/master-data.policies';
import { DeleteMasterDataResponseDto } from '@/common/catalog/delete-response.dto';
import { CreateMedicationDto, UpdateMedicationDto } from './dto/medication.dto';
import { MedicationResponseDto } from './dto/medication-response.dto';
import { MedicationsService } from './medications.service';

@ApiTags('medications')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiForbiddenResponse({ description: 'Insufficient CASL permissions' })
@Controller('medications')
export class MedicationsController {
  constructor(private readonly medications: MedicationsService) {}

  @CheckPolicies(readMasterDataPolicy())
  @Get()
  @ApiOperation({ summary: 'List medications' })
  @ApiOkResponseData(MedicationResponseDto, { isArray: true })
  listMedications() {
    return this.medications.findAll();
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Post()
  @ApiOperation({ summary: 'Create medication' })
  @ApiCreatedResponseData(MedicationResponseDto)
  createMedication(@Body() dto: CreateMedicationDto) {
    return this.medications.create(dto);
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Patch(':id')
  @ApiOperation({ summary: 'Update medication' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponseData(MedicationResponseDto)
  @ApiNotFoundResponse()
  updateMedication(@Param('id') id: string, @Body() dto: UpdateMedicationDto) {
    return this.medications.update(id, dto);
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Delete(':id')
  @ApiOperation({ summary: 'Delete medication' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponseData(DeleteMasterDataResponseDto)
  @ApiNotFoundResponse()
  removeMedication(@Param('id') id: string) {
    return this.medications.remove(id);
  }
}
