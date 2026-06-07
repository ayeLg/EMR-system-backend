import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

export interface CreateAuditLogData {
  userId: string;
  action: string;
  module: string;
  resourceId?: string;
  oldData?: any;
  newData?: any;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateAuditLogData) {
    return this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        module: data.module,
        resourceId: data.resourceId,
        oldData: data.oldData as Prisma.InputJsonValue,
        newData: data.newData as Prisma.InputJsonValue,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }

  async findAll(params?: { search?: string }) {
    const where: Prisma.AuditLogWhereInput = {};

    if (params?.search) {
      const s = params.search.trim();
      where.OR = [
        { action: { contains: s, mode: 'insensitive' } },
        { module: { contains: s, mode: 'insensitive' } },
        {
          user: {
            fullName: { contains: s, mode: 'insensitive' },
          },
        },
      ];
    }

    return this.prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
