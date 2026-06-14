import { Controller, Get, Param, Patch, Post } from '@nestjs/common';
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
import { NotificationService } from './notification.service';
import { readUserPolicy } from '@/authorization/policies/users.policies';

@ApiTags('notifications')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
@ApiForbiddenResponse({ description: 'Insufficient CASL permissions' })
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @CheckPolicies(readUserPolicy())
  @Get()
  @ApiOperation({ summary: 'Get all notifications for the current user' })
  getNotifications(@CurrentUser() user: User) {
    return this.notificationService.getNotifications(user.id);
  }

  @CheckPolicies(readUserPolicy())
  @Patch(':id/read')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({ summary: 'Mark a specific notification as read' })
  markAsRead(@Param('id') id: string, @CurrentUser() user: User) {
    return this.notificationService.markAsRead(id, user.id);
  }

  @CheckPolicies(readUserPolicy())
  @Post('mark-all-read')
  @ApiOperation({ summary: 'Mark all unread notifications as read' })
  markAllAsRead(@CurrentUser() user: User) {
    return this.notificationService.markAllAsRead(user.id);
  }
}
