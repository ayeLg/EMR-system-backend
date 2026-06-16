import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { SmsService } from '@/common/messaging/sms.service';
import { NotificationType } from '@prisma/client';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  refType?: string;
  refId?: string;
}

export interface DispatchInput extends CreateNotificationInput {
  /** When provided, also sends an SMS fallback to this number. */
  sms?: { phone?: string | null; text?: string };
}

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sms: SmsService,
  ) {}

  /**
   * Create an in-app notification and (optionally) send an SMS fallback in one
   * call — the channel matrix in CLAUDE.md (in-app + SMS) lives here.
   */
  async dispatch(dto: DispatchInput) {
    const notification = await this.createNotification(dto);
    if (dto.sms) {
      await this.sms.send(dto.sms.phone, dto.sms.text ?? dto.body);
    }
    return notification;
  }

  async getNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async createNotification(dto: CreateNotificationInput) {
    return this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        body: dto.body,
        refType: dto.refType || null,
        refId: dto.refId || null,
      },
    });
  }
}
