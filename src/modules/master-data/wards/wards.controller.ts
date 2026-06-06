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
import { CreateWardDto, UpdateWardDto } from './dto/ward.dto';
import { WardResponseDto } from './dto/ward-response.dto';
import { WardsService } from './wards.service';

@ApiTags('wards')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiForbiddenResponse({ description: 'Insufficient CASL permissions' })
@Controller('master-data/wards')
export class WardsController {
  constructor(private readonly wards: WardsService) {}

  @CheckPolicies(readMasterDataPolicy())
  @Get()
  @ApiOperation({ summary: 'List wards' })
  @ApiOkResponseData(WardResponseDto, { isArray: true })
  listWards() {
    return this.wards.findAll();
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Post()
  @ApiOperation({ summary: 'Create ward' })
  @ApiCreatedResponseData(WardResponseDto)
  createWard(@Body() dto: CreateWardDto) {
    return this.wards.create(dto);
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Patch(':id')
  @ApiOperation({ summary: 'Update ward' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponseData(WardResponseDto)
  @ApiNotFoundResponse()
  updateWard(@Param('id') id: string, @Body() dto: UpdateWardDto) {
    return this.wards.update(id, dto);
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Delete(':id')
  @ApiOperation({ summary: 'Delete ward' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponseData(DeleteMasterDataResponseDto)
  @ApiNotFoundResponse()
  removeWard(@Param('id') id: string) {
    return this.wards.remove(id);
  }
}
