import { Body, Controller, Param, Post } from '@nestjs/common';
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
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ApiOkResponseData } from '@/common/swagger/api-response.decorator';
import { SWAGGER_BEARER_AUTH } from '@/common/swagger/setup-swagger';
import { AppointmentResponseDto } from '@/modules/appointments/dto/appointment-response.dto';
import { updateAppointmentPolicy } from '@/modules/appointments/policies/appointment.policies';
import type { User } from '@/modules/users/entities/user.entity';
import { RecordVitalsDto } from './dto/record-vitals.dto';
import { VitalsService } from './vitals.service';

@ApiTags('vitals')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiForbiddenResponse({ description: 'Insufficient CASL permissions' })
@Controller('appointments/:appointmentId/vitals')
export class VitalsController {
  constructor(private readonly vitalsService: VitalsService) {}

  @CheckPolicies(updateAppointmentPolicy())
  @Post()
  @ApiOperation({ summary: 'Record appointment vitals' })
  @ApiParam({ name: 'appointmentId', format: 'uuid' })
  @ApiOkResponseData(AppointmentResponseDto)
  @ApiNotFoundResponse()
  recordAppointmentVitals(
    @Param('appointmentId') appointmentId: string,
    @Body() dto: RecordVitalsDto,
    @CurrentUser() user: User,
  ): Promise<AppointmentResponseDto> {
    return this.vitalsService.recordAppointmentVitals(
      appointmentId,
      dto,
      user.id,
    );
  }
}
