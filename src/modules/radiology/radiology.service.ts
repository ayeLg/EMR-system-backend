import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AuditService } from '@/modules/audit/audit.service';
import { CryptoService } from '@/common/security/crypto.service';
import { decryptPatientName } from '@/common/security/phi.util';
import { OrderStatus, Prisma } from '@prisma/client';
import { SubmitRadiologyResultsDto } from './dto/submit-results.dto';
import {
  RadiologyOrderResponseDto,
  RadiologyDetailsDto,
} from './dto/radiology-order-response.dto';

@Injectable()
export class RadiologyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly crypto: CryptoService,
  ) {}

  async findAll(): Promise<RadiologyOrderResponseDto[]> {
    const orders = await this.prisma.medicalOrder.findMany({
      where: { orderType: 'RADIOLOGY' },
      include: {
        encounter: {
          include: {
            patient: { select: { firstName: true, lastName: true, mrn: true } },
            attendingDoctor: { select: { fullName: true } },
          },
        },
      },
      orderBy: { orderedAt: 'desc' },
    });

    return orders.map((o) => {
      const details = o.details as unknown as RadiologyDetailsDto | null;
      return {
        id: o.id,
        encounterId: o.encounterId,
        patientName: decryptPatientName(this.crypto, o.encounter.patient),
        mrn: o.encounter.patient.mrn,
        orderedBy: o.encounter.attendingDoctor.fullName,
        orderedAt: o.orderedAt.toISOString(),
        priority: o.priority,
        status: o.status,
        description: o.description,
        notes: o.notes ?? undefined,
        completedAt: o.completedAt?.toISOString() ?? undefined,
        details: details ?? undefined,
      };
    });
  }

  async findOne(id: string): Promise<RadiologyOrderResponseDto> {
    const order = await this.prisma.medicalOrder.findFirst({
      where: { id, orderType: 'RADIOLOGY' },
      include: {
        encounter: {
          include: {
            patient: { select: { firstName: true, lastName: true, mrn: true } },
            attendingDoctor: { select: { fullName: true } },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Radiology order ${id} not found`);
    }

    const details = order.details as unknown as RadiologyDetailsDto | null;
    return {
      id: order.id,
      encounterId: order.encounterId,
      patientName: decryptPatientName(this.crypto, order.encounter.patient),
      mrn: order.encounter.patient.mrn,
      orderedBy: order.encounter.attendingDoctor.fullName,
      orderedAt: order.orderedAt.toISOString(),
      priority: order.priority,
      status: order.status,
      description: order.description,
      notes: order.notes ?? undefined,
      completedAt: order.completedAt?.toISOString() ?? undefined,
      details: details ?? undefined,
    };
  }

  async startScan(
    id: string,
    userId: string,
  ): Promise<RadiologyOrderResponseDto> {
    const order = await this.findOne(id);
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        `Cannot start scan for order in status ${order.status}`,
      );
    }

    await this.prisma.medicalOrder.update({
      where: { id },
      data: { status: OrderStatus.IN_PROGRESS },
    });

    await this.audit.create({
      userId,
      action: 'START_RADIOLOGY_SCAN',
      module: 'RADIOLOGY',
      resourceId: id,
      newData: { status: OrderStatus.IN_PROGRESS },
    });

    return this.findOne(id);
  }

  async saveResults(
    id: string,
    dto: SubmitRadiologyResultsDto,
    userId: string,
  ): Promise<RadiologyOrderResponseDto> {
    const order = await this.findOne(id);
    if (order.status !== OrderStatus.IN_PROGRESS) {
      throw new BadRequestException(
        `Cannot submit results for order in status ${order.status}. Must be IN_PROGRESS.`,
      );
    }

    const performer = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true },
    });

    const detailsPayload: RadiologyDetailsDto = {
      findings: dto.findings,
      impression: dto.impression,
      imagingUrl: dto.imagingUrl,
      performedBy: performer?.fullName ?? 'System',
      performedAt: new Date().toISOString(),
    };

    await this.prisma.medicalOrder.update({
      where: { id },
      data: {
        status: OrderStatus.COMPLETED,
        completedAt: new Date(),
        details: detailsPayload as unknown as Prisma.InputJsonValue,
      },
    });

    await this.audit.create({
      userId,
      action: 'SUBMIT_RADIOLOGY_RESULTS',
      module: 'RADIOLOGY',
      resourceId: id,
      newData: { status: OrderStatus.COMPLETED, details: detailsPayload },
    });

    return this.findOne(id);
  }

  async cancelOrder(
    id: string,
    userId: string,
  ): Promise<RadiologyOrderResponseDto> {
    const order = await this.findOne(id);
    if (
      order.status === OrderStatus.COMPLETED ||
      order.status === OrderStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot cancel order in status ${order.status}`,
      );
    }

    await this.prisma.medicalOrder.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED },
    });

    await this.audit.create({
      userId,
      action: 'CANCEL_RADIOLOGY_ORDER',
      module: 'RADIOLOGY',
      resourceId: id,
      newData: { status: OrderStatus.CANCELLED },
    });

    return this.findOne(id);
  }
}
