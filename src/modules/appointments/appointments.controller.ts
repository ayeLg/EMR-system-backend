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
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import {
  AppointmentResponseDto,
  DeleteAppointmentResponseDto,
} from './dto/appointment-response.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import {
  createAppointmentPolicy,
  deleteAppointmentPolicy,
  readAppointmentPolicy,
  updateAppointmentPolicy,
} from './policies/appointment.policies';

@ApiTags('appointments')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiForbiddenResponse({ description: 'Insufficient CASL permissions' })
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @CheckPolicies(readAppointmentPolicy())
  @Get()
  @ApiOperation({ summary: 'List all appointments' })
  @ApiOkResponseData(AppointmentResponseDto, { isArray: true })
  findAll(): Promise<AppointmentResponseDto[]> {
    return this.appointmentsService.findAll();
  }

  @CheckPolicies(readAppointmentPolicy())
  @Get('nurse-queue')
  @ApiOperation({ summary: 'List arrived appointments for nurse queue' })
  @ApiOkResponseData(AppointmentResponseDto, { isArray: true })
  findNurseQueue(): Promise<AppointmentResponseDto[]> {
    return this.appointmentsService.findNurseQueue();
  }

  @CheckPolicies(readAppointmentPolicy())
  @Get(':id')
  @ApiOperation({ summary: 'Get appointment by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponseData(AppointmentResponseDto)
  @ApiNotFoundResponse()
  findOne(@Param('id') id: string): Promise<AppointmentResponseDto> {
    return this.appointmentsService.findOne(id);
  }

  @CheckPolicies(createAppointmentPolicy())
  @Post()
  @ApiOperation({ summary: 'Create an appointment' })
  @ApiCreatedResponseData(AppointmentResponseDto)
  create(
    @Body() dto: CreateAppointmentDto,
    @CurrentUser() user: User,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentsService.create(dto, user.id);
  }

  @CheckPolicies(updateAppointmentPolicy())
  @Patch(':id')
  @ApiOperation({ summary: 'Update an appointment' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponseData(AppointmentResponseDto)
  @ApiNotFoundResponse()
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentsService.update(id, dto);
  }

  @CheckPolicies(deleteAppointmentPolicy())
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an appointment' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponseData(DeleteAppointmentResponseDto)
  @ApiNotFoundResponse()
  async remove(@Param('id') id: string): Promise<DeleteAppointmentResponseDto> {
    await this.appointmentsService.remove(id);
    return { deleted: true };
  }
}
