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
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';
import { ServiceResponseDto } from './dto/service-response.dto';
import { ServicesCatalogService } from './services-catalog.service';

@ApiTags('services')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiForbiddenResponse({ description: 'Insufficient CASL permissions' })
@Controller('services')
export class ServicesCatalogController {
  constructor(private readonly services: ServicesCatalogService) {}

  @CheckPolicies(readMasterDataPolicy())
  @Get()
  @ApiOperation({ summary: 'List billable services' })
  @ApiOkResponseData(ServiceResponseDto, { isArray: true })
  listServices() {
    return this.services.findAll();
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Post()
  @ApiOperation({ summary: 'Create service' })
  @ApiCreatedResponseData(ServiceResponseDto)
  createService(@Body() dto: CreateServiceDto) {
    return this.services.create(dto);
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Patch(':id')
  @ApiOperation({ summary: 'Update service' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponseData(ServiceResponseDto)
  @ApiNotFoundResponse()
  updateService(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.services.update(id, dto);
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Delete(':id')
  @ApiOperation({ summary: 'Delete service' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponseData(DeleteMasterDataResponseDto)
  @ApiNotFoundResponse()
  removeService(@Param('id') id: string) {
    return this.services.remove(id);
  }
}
