import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
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
import {
  CreateDoctorScheduleDto,
  SetDoctorScheduleActiveDto,
  UpdateDoctorScheduleDto,
} from './dto/doctor-schedule.dto';
import { DoctorScheduleResponseDto } from './dto/doctor-schedule-response.dto';
import { DoctorSchedulesService } from './doctor-schedules.service';

@ApiTags('doctor-schedules')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiForbiddenResponse({ description: 'Insufficient CASL permissions' })
@Controller('doctor-schedules')
export class DoctorSchedulesController {
  constructor(private readonly schedules: DoctorSchedulesService) {}

  @CheckPolicies(readMasterDataPolicy())
  @Get()
  @ApiOperation({ summary: 'List doctor schedules' })
  @ApiQuery({ name: 'doctorId', required: false, format: 'uuid' })
  @ApiQuery({ name: 'dayOfWeek', required: false, type: Number })
  @ApiOkResponseData(DoctorScheduleResponseDto, { isArray: true })
  listSchedules(
    @Query('doctorId') doctorId?: string,
    @Query('dayOfWeek') dayOfWeek?: string,
  ): Promise<DoctorScheduleResponseDto[]> {
    return this.schedules.findAll({
      doctorId,
      dayOfWeek:
        dayOfWeek !== undefined && dayOfWeek !== ''
          ? Number(dayOfWeek)
          : undefined,
    });
  }

  @CheckPolicies(readMasterDataPolicy())
  @Get(':id')
  @ApiOperation({ summary: 'Get doctor schedule by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponseData(DoctorScheduleResponseDto)
  @ApiNotFoundResponse()
  getSchedule(@Param('id') id: string): Promise<DoctorScheduleResponseDto> {
    return this.schedules.findOne(id);
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Post()
  @ApiOperation({ summary: 'Create doctor schedule' })
  @ApiCreatedResponseData(DoctorScheduleResponseDto)
  createSchedule(
    @Body() dto: CreateDoctorScheduleDto,
  ): Promise<DoctorScheduleResponseDto> {
    return this.schedules.create(dto);
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Patch(':id/is-active')
  @ApiOperation({ summary: 'Activate or deactivate schedule' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponseData(DoctorScheduleResponseDto)
  @ApiNotFoundResponse()
  setScheduleActive(
    @Param('id') id: string,
    @Body() dto: SetDoctorScheduleActiveDto,
  ): Promise<DoctorScheduleResponseDto> {
    return this.schedules.setIsActive(id, dto.isActive);
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Patch(':id')
  @ApiOperation({ summary: 'Update doctor schedule' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponseData(DoctorScheduleResponseDto)
  @ApiNotFoundResponse()
  updateSchedule(
    @Param('id') id: string,
    @Body() dto: UpdateDoctorScheduleDto,
  ): Promise<DoctorScheduleResponseDto> {
    return this.schedules.update(id, dto);
  }

  @CheckPolicies(manageMasterDataPolicy())
  @Delete(':id')
  @ApiOperation({ summary: 'Delete doctor schedule' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponseData(DeleteMasterDataResponseDto)
  @ApiNotFoundResponse()
  removeSchedule(@Param('id') id: string) {
    return this.schedules.remove(id);
  }
}
