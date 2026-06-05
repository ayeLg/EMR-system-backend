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
import { CreateLabTestDto, UpdateLabTestDto } from './dto/lab-test.dto';
import { LabTestResponseDto } from './dto/lab-test-response.dto';
import { LabTestsService } from './lab-tests.service';

@ApiTags('lab-tests')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiForbiddenResponse({ description: 'Insufficient CASL permissions' })
@Controller('lab-tests')
export class LabTestsController {
  constructor(private readonly labTests: LabTestsService) {}

  @CheckPolicies(readMasterDataPolicy())
  @Get()
  @ApiOperation({ summary: 'List lab tests' })
  @ApiOkResponseData(LabTestResponseDto, { isArray: true })
  listLabTests() {
    return this.labTests.findAll();
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Post()
  @ApiOperation({ summary: 'Create lab test' })
  @ApiCreatedResponseData(LabTestResponseDto)
  createLabTest(@Body() dto: CreateLabTestDto) {
    return this.labTests.create(dto);
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Patch(':id')
  @ApiOperation({ summary: 'Update lab test' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponseData(LabTestResponseDto)
  @ApiNotFoundResponse()
  updateLabTest(@Param('id') id: string, @Body() dto: UpdateLabTestDto) {
    return this.labTests.update(id, dto);
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Delete(':id')
  @ApiOperation({ summary: 'Delete lab test' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponseData(DeleteMasterDataResponseDto)
  @ApiNotFoundResponse()
  removeLabTest(@Param('id') id: string) {
    return this.labTests.remove(id);
  }
}
