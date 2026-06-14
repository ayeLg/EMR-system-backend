import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CheckPolicies } from '@/common/decorators/check-policies.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { SWAGGER_BEARER_AUTH } from '@/common/swagger/setup-swagger';
import type { User } from '@/modules/users/entities/user.entity';
import { BillingService, SerializedInvoice } from './billing.service';
import {
  readBillingPolicy,
  updateBillingPolicy,
} from './policies/billing.policies';
import {
  RecordPaymentDto,
  SubmitClaimDto,
  VoidInvoiceDto,
} from './dto/billing.dto';

@ApiTags('billing')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiForbiddenResponse({ description: 'Insufficient CASL permissions' })
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @CheckPolicies(readBillingPolicy())
  @Get('invoices')
  @ApiOperation({ summary: 'List all invoices in the system' })
  getInvoices(): Promise<SerializedInvoice[]> {
    return this.billingService.getInvoices();
  }

  @CheckPolicies(readBillingPolicy())
  @Get('invoices/:id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({
    summary: 'Get detailed invoice with auto-population of line items',
  })
  getInvoice(@Param('id') id: string): Promise<SerializedInvoice> {
    return this.billingService.getInvoice(id);
  }

  @CheckPolicies(updateBillingPolicy())
  @Post('invoices/:id/payments')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Record a payment for an invoice' })
  recordPayment(
    @Param('id') id: string,
    @Body() dto: RecordPaymentDto,
    @CurrentUser() user: User,
  ): Promise<unknown> {
    return this.billingService.recordPayment(id, dto, user.id);
  }

  @CheckPolicies(updateBillingPolicy())
  @Post('invoices/:id/claims')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Submit an insurance claim for an invoice' })
  submitClaim(
    @Param('id') id: string,
    @Body() dto: SubmitClaimDto,
  ): Promise<unknown> {
    return this.billingService.submitClaim(id, dto);
  }

  @CheckPolicies(updateBillingPolicy())
  @Post('invoices/:id/void')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Void an invoice' })
  voidInvoice(
    @Param('id') id: string,
    @Body() dto: VoidInvoiceDto,
    @CurrentUser() user: User,
  ): Promise<unknown> {
    return this.billingService.voidInvoice(id, dto, user.id);
  }
}
