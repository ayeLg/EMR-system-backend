import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CheckPolicies } from '@/common/decorators/check-policies.decorator';
import { readMasterDataPolicy } from '@/authorization/policies/master-data.policies';
import { ApiOkResponseData } from '@/common/swagger/api-response.decorator';
import { SWAGGER_BEARER_AUTH } from '@/common/swagger/setup-swagger';
import { AuditService } from './audit.service';
import { AuditResponseDto } from './dto/audit-response.dto';

@ApiTags('audit-logs')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiForbiddenResponse({ description: 'Insufficient CASL permissions' })
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditService: AuditService) {}

  @CheckPolicies(readMasterDataPolicy())
  @Get()
  @ApiOperation({ summary: 'List system audit logs' })
  @ApiOkResponseData(AuditResponseDto, { isArray: true })
  async listLogs(
    @Query('search') search?: string,
  ): Promise<AuditResponseDto[]> {
    const logs = await this.auditService.findAll({ search });

    return logs.map((log) => {
      // Find a user-friendly resource name/code from the recorded data payload
      let resource = log.resourceId ?? '';

      if (log.newData && typeof log.newData === 'object') {
        const data = log.newData as Record<string, unknown>;
        const val =
          data.mrn ??
          data.employeeId ??
          data.code ??
          data.rxNumber ??
          data.orderNo ??
          data.invoiceNo ??
          data.name;
        if (typeof val === 'string') {
          resource = val;
        }
      } else if (log.oldData && typeof log.oldData === 'object') {
        const data = log.oldData as Record<string, unknown>;
        const val =
          data.mrn ??
          data.employeeId ??
          data.code ??
          data.rxNumber ??
          data.orderNo ??
          data.invoiceNo ??
          data.name;
        if (typeof val === 'string') {
          resource = val;
        }
      }

      return {
        id: log.id,
        time: log.createdAt,
        user: log.user?.fullName ?? 'System',
        action: log.action,
        module: log.module,
        resource,
        ip: log.ipAddress ?? '',
      };
    });
  }
}
