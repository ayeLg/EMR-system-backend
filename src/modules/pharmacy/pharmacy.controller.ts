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
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import {
  ApiCreatedResponseData,
  ApiOkResponseData,
} from '@/common/swagger/api-response.decorator';
import { SWAGGER_BEARER_AUTH } from '@/common/swagger/setup-swagger';
import type { User } from '@/modules/users/entities/user.entity';
import { DispensePrescriptionDto } from './dto/dispense-prescription.dto';
import {
  CreateInventoryDto,
  UpdateInventoryDto,
} from './dto/inventory-write.dto';
import { InventoryResponseDto } from './dto/inventory-response.dto';
import { PrescriptionResponseDto } from './dto/prescription-response.dto';
import { PharmacyService } from './pharmacy.service';
import {
  readPharmacyPolicy,
  updatePharmacyPolicy,
} from './policies/pharmacy.policies';

@ApiTags('pharmacy')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiForbiddenResponse({ description: 'Insufficient CASL permissions' })
@Controller('pharmacy')
export class PharmacyController {
  constructor(private readonly pharmacyService: PharmacyService) {}

  @CheckPolicies(readPharmacyPolicy())
  @Get('prescriptions')
  @ApiOperation({ summary: 'List all prescriptions' })
  @ApiOkResponseData(PrescriptionResponseDto, { isArray: true })
  findAllPrescriptions(): Promise<PrescriptionResponseDto[]> {
    return this.pharmacyService.findAllPrescriptions();
  }

  @CheckPolicies(readPharmacyPolicy())
  @Get('inventory')
  @ApiOperation({ summary: 'List all inventory items' })
  @ApiOkResponseData(InventoryResponseDto, { isArray: true })
  findAllInventory(): Promise<InventoryResponseDto[]> {
    return this.pharmacyService.findAllInventory();
  }

  @CheckPolicies(updatePharmacyPolicy())
  @Post('prescriptions/:id/dispense')
  @ApiOperation({
    summary:
      'Dispense a prescription with interaction guards and FIFO deduction',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiCreatedResponseData(PrescriptionResponseDto)
  @ApiNotFoundResponse({ description: 'Prescription not found' })
  dispensePrescription(
    @Param('id') id: string,
    @Body() dto: DispensePrescriptionDto,
    @CurrentUser() user: User,
  ): Promise<PrescriptionResponseDto> {
    return this.pharmacyService.dispensePrescription(id, dto, user.id);
  }

  @CheckPolicies(updatePharmacyPolicy())
  @Post('inventory')
  @ApiOperation({ summary: 'Create new inventory batch' })
  @ApiCreatedResponseData(InventoryResponseDto)
  createInventory(
    @Body() dto: CreateInventoryDto,
    @CurrentUser() user: User,
  ): Promise<InventoryResponseDto> {
    return this.pharmacyService.createInventory(dto, user.id);
  }

  @CheckPolicies(updatePharmacyPolicy())
  @Patch('inventory/:id')
  @ApiOperation({ summary: 'Update an inventory batch' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponseData(InventoryResponseDto)
  @ApiNotFoundResponse({ description: 'Inventory item not found' })
  updateInventory(
    @Param('id') id: string,
    @Body() dto: UpdateInventoryDto,
    @CurrentUser() user: User,
  ): Promise<InventoryResponseDto> {
    return this.pharmacyService.updateInventory(id, dto, user.id);
  }

  @CheckPolicies(updatePharmacyPolicy())
  @Delete('inventory/:id')
  @ApiOperation({ summary: 'Delete an inventory batch' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponseData(Object)
  @ApiNotFoundResponse({ description: 'Inventory item not found' })
  deleteInventory(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<{ deleted: boolean }> {
    return this.pharmacyService.deleteInventory(id, user.id);
  }
}
