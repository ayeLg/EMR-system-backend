import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CheckPolicies } from '@/common/decorators/check-policies.decorator';
import { SWAGGER_BEARER_AUTH } from '@/common/swagger/setup-swagger';
import { readMasterDataPolicy } from '@/authorization/policies/master-data.policies';
import { Icd10Service } from './icd10.service';

@ApiTags('icd10')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@Controller('master-data/icd10')
export class Icd10Controller {
  constructor(private readonly icd10: Icd10Service) {}

  @CheckPolicies(readMasterDataPolicy())
  @Get()
  @ApiOperation({ summary: 'Search ICD-10 diagnosis catalog' })
  @ApiQuery({ name: 'q', required: false })
  search(@Query('q') q?: string) {
    return this.icd10.search(q);
  }
}
