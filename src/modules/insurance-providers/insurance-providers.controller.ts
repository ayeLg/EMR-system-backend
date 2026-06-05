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
import {
  CreateInsuranceProviderDto,
  UpdateInsuranceProviderDto,
} from './dto/insurance-provider.dto';
import { InsuranceProviderResponseDto } from './dto/insurance-provider-response.dto';
import { InsuranceProvidersService } from './insurance-providers.service';

@ApiTags('insurance-providers')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiForbiddenResponse({ description: 'Insufficient CASL permissions' })
@Controller('insurance-providers')
export class InsuranceProvidersController {
  constructor(private readonly insuranceProviders: InsuranceProvidersService) {}

  @CheckPolicies(readMasterDataPolicy())
  @Get()
  @ApiOperation({ summary: 'List insurance providers' })
  @ApiOkResponseData(InsuranceProviderResponseDto, { isArray: true })
  listInsuranceProviders() {
    return this.insuranceProviders.findAll();
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Post()
  @ApiOperation({ summary: 'Create insurance provider' })
  @ApiCreatedResponseData(InsuranceProviderResponseDto)
  createInsuranceProvider(@Body() dto: CreateInsuranceProviderDto) {
    return this.insuranceProviders.create(dto);
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Patch(':id')
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
  @Delete(':id')
  @ApiOperation({ summary: 'Delete insurance provider' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponseData(DeleteMasterDataResponseDto)
  @ApiNotFoundResponse()
  removeInsuranceProvider(@Param('id') id: string) {
    return this.insuranceProviders.remove(id);
  }
}
