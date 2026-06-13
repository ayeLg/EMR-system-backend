import { Body, Controller, Get, Param, Post } from '@nestjs/common';
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
import {
  ApiCreatedResponseData,
  ApiOkResponseData,
} from '@/common/swagger/api-response.decorator';
import { SWAGGER_BEARER_AUTH } from '@/common/swagger/setup-swagger';
import type { User } from '@/modules/users/entities/user.entity';
import { SubmitRadiologyResultsDto } from './dto/submit-results.dto';
import { RadiologyOrderResponseDto } from './dto/radiology-order-response.dto';
import { RadiologyService } from './radiology.service';
import {
  readRadiologyPolicy,
  updateRadiologyPolicy,
} from './policies/radiology.policies';

@ApiTags('radiology')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiForbiddenResponse({ description: 'Insufficient CASL permissions' })
@Controller('radiology/orders')
export class RadiologyController {
  constructor(private readonly service: RadiologyService) {}

  @CheckPolicies(readRadiologyPolicy())
  @Get()
  @ApiOperation({ summary: 'List all radiology orders' })
  @ApiOkResponseData(RadiologyOrderResponseDto, { isArray: true })
  listOrders(): Promise<RadiologyOrderResponseDto[]> {
    return this.service.findAll();
  }

  @CheckPolicies(readRadiologyPolicy())
  @Get(':id')
  @ApiOperation({ summary: 'Get radiology order details' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponseData(RadiologyOrderResponseDto)
  @ApiNotFoundResponse({ description: 'Order not found' })
  getOrderDetail(@Param('id') id: string): Promise<RadiologyOrderResponseDto> {
    return this.service.findOne(id);
  }

  @CheckPolicies(updateRadiologyPolicy())
  @Post(':id/start')
  @ApiOperation({ summary: 'Start radiology scan execution' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponseData(RadiologyOrderResponseDto)
  startScan(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<RadiologyOrderResponseDto> {
    return this.service.startScan(id, user.id);
  }

  @CheckPolicies(updateRadiologyPolicy())
  @Post(':id/results')
  @ApiOperation({ summary: 'Submit radiology scan results' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponseData(RadiologyOrderResponseDto)
  submitResults(
    @Param('id') id: string,
    @Body() dto: SubmitRadiologyResultsDto,
    @CurrentUser() user: User,
  ): Promise<RadiologyOrderResponseDto> {
    return this.service.saveResults(id, dto, user.id);
  }

  @CheckPolicies(updateRadiologyPolicy())
  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel radiology order' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponseData(RadiologyOrderResponseDto)
  cancelOrder(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<RadiologyOrderResponseDto> {
    return this.service.cancelOrder(id, user.id);
  }
}
