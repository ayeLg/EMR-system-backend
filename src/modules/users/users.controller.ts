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
  readUserPolicy,
  manageUserPolicy,
} from '@/authorization/policies/users.policies';
import {
  ApiCreatedResponseData,
  ApiOkResponseData,
} from '@/common/swagger/api-response.decorator';
import { SWAGGER_BEARER_AUTH } from '@/common/swagger/setup-swagger';
import type { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateUserStatusDto,
} from './dto/user.dto';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('users')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiForbiddenResponse({ description: 'Insufficient CASL permissions' })
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
  ) {}

  @CheckPolicies(readUserPolicy())
  @Get()
  @ApiOperation({ summary: 'List all staff users' })
  @ApiOkResponseData(UserResponseDto, { isArray: true })
  listUsers(): Promise<UserResponseDto[]> {
    return this.usersService.findAllStaff();
  }

  @CheckPolicies(manageUserPolicy())
  @Post()
  @ApiOperation({ summary: 'Create a staff user' })
  @ApiCreatedResponseData(UserResponseDto)
  async createUser(
    @Body() dto: CreateUserDto,
    @CurrentUser() currentUser: User,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.createStaff(dto);

    await this.auditService.create({
      userId: currentUser.id,
      action: 'CREATE',
      module: 'User',
      resourceId: user.id,
      newData: user,
    });

    return user;
  }

  @CheckPolicies(manageUserPolicy())
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update user active status' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponseData(UserResponseDto)
  @ApiNotFoundResponse()
  async setUserStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() currentUser: User,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.setStatus(id, dto.status);

    await this.auditService.create({
      userId: currentUser.id,
      action: 'UPDATE',
      module: 'User',
      resourceId: user.id,
      newData: { status: user.status },
    });

    return user;
  }

  @CheckPolicies(manageUserPolicy())
  @Patch(':id')
  @ApiOperation({ summary: 'Update user details' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponseData(UserResponseDto)
  @ApiNotFoundResponse()
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: User,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.updateStaff(id, dto);

    await this.auditService.create({
      userId: currentUser.id,
      action: 'UPDATE',
      module: 'User',
      resourceId: user.id,
      newData: user,
    });

    return user;
  }

  @CheckPolicies(manageUserPolicy())
  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate user' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponseData(UserResponseDto)
  @ApiNotFoundResponse()
  async deactivateUser(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.deactivateStaff(id);

    await this.auditService.create({
      userId: currentUser.id,
      action: 'DELETE',
      module: 'User',
      resourceId: user.id,
      newData: { status: 'INACTIVE' },
    });

    return user;
  }
}
