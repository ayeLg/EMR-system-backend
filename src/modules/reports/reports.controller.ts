import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CheckPolicies } from '@/common/decorators/check-policies.decorator';
import { SWAGGER_BEARER_AUTH } from '@/common/swagger/setup-swagger';
import { ReportsService } from './reports.service';
import { readReportPolicy } from './policies/reports.policies';

@ApiTags('reports')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiForbiddenResponse({ description: 'Insufficient CASL permissions' })
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @CheckPolicies(readReportPolicy())
  @Get('dashboard')
  @ApiOperation({ summary: 'Get live aggregated metrics for the dashboard' })
  getDashboardStats() {
    return this.reportsService.getDashboardStats();
  }
}
