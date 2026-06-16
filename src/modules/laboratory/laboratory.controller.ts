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
import { CollectSpecimenDto } from './dto/collect-specimen.dto';
import { LabOrderResponseDto } from './dto/lab-order-response.dto';
import { SaveLabResultsDto } from './dto/save-results.dto';
import { LaboratoryService } from './laboratory.service';
import {
  readLaboratoryPolicy,
  updateLaboratoryPolicy,
} from './policies/laboratory.policies';

@ApiTags('laboratory')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiForbiddenResponse({ description: 'Insufficient CASL permissions' })
@Controller('lab/orders')
export class LaboratoryController {
  constructor(private readonly service: LaboratoryService) {}

  @CheckPolicies(readLaboratoryPolicy())
  @Get()
  @ApiOperation({ summary: 'List all lab orders' })
  @ApiOkResponseData(LabOrderResponseDto, { isArray: true })
  listOrders() {
    return this.service.findAll();
  }

  @CheckPolicies(readLaboratoryPolicy())
  @Get(':id')
  @ApiOperation({ summary: 'Get lab order detail' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponseData(LabOrderResponseDto)
  @ApiNotFoundResponse({ description: 'Order not found' })
  getOrderDetail(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @CheckPolicies(updateLaboratoryPolicy())
  @Post(':id/specimens')
  @ApiOperation({ summary: 'Collect specimen for order' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponseData(LabOrderResponseDto)
  collectSpecimen(
    @Param('id') id: string,
    @Body() dto: CollectSpecimenDto,
    @CurrentUser() user: User,
  ) {
    return this.service.collectSpecimen(id, dto, user.id);
  }

  @CheckPolicies(updateLaboratoryPolicy())
  @Post(':id/results')
  @ApiOperation({ summary: 'Save results for order' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponseData(LabOrderResponseDto)
  saveResults(
    @Param('id') id: string,
    @Body() dto: SaveLabResultsDto,
    @CurrentUser() user: User,
  ) {
    return this.service.saveResults(id, dto, user.id);
  }

  @CheckPolicies(updateLaboratoryPolicy())
  @Post(':id/verify')
  @ApiOperation({ summary: 'Verify and release lab results' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponseData(LabOrderResponseDto)
  verifyResults(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.verifyResults(id, user.id);
  }

  @CheckPolicies(updateLaboratoryPolicy())
  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel lab order' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponseData(LabOrderResponseDto)
  cancelOrder(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.cancelOrder(id, user.id);
  }

  @CheckPolicies(updateLaboratoryPolicy())
  @Post('results/:resultId/acknowledge')
  @ApiOperation({
    summary: 'Acknowledge a critical lab value (stops escalation)',
  })
  @ApiParam({ name: 'resultId', format: 'uuid' })
  acknowledgeCritical(
    @Param('resultId') resultId: string,
    @CurrentUser() user: User,
  ) {
    return this.service.acknowledgeCritical(resultId, user.id);
  }
}
