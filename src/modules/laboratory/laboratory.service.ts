import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LabOrderStatus } from '@prisma/client';
import { randomInt } from 'node:crypto';
import { PrismaService } from '@/prisma/prisma.service';
import { AuditService } from '@/modules/audit/audit.service';
import { CollectSpecimenDto } from './dto/collect-specimen.dto';
import { SaveLabResultsDto } from './dto/save-results.dto';

interface ReferenceRange {
  gender: string;
  ageMin?: number;
  ageMax?: number;
  low: number;
  high: number;
  unit: string;
  criticalLow: number;
  criticalHigh: number;
}

@Injectable()
export class LaboratoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll() {
    const orders = await this.prisma.labOrder.findMany({
      include: {
        patient: { select: { firstName: true, lastName: true, mrn: true } },
        orderedBy: { select: { fullName: true } },
      },
      orderBy: { orderedAt: 'desc' },
    });

    return orders.map((o) => ({
      id: o.id,
      orderNo: o.orderNo,
      patientName: `${o.patient.firstName} ${o.patient.lastName}`,
      mrn: o.patient.mrn,
      orderedBy: o.orderedBy.fullName,
      orderedAt: o.orderedAt.toISOString(),
      priority: o.priority,
      status: o.status,
    }));
  }

  async findOne(id: string) {
    const order = await this.prisma.labOrder.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            mrn: true,
            dateOfBirth: true,
            gender: true,
          },
        },
        orderedBy: { select: { fullName: true } },
        items: {
          include: {
            labTest: true,
            result: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Lab order ${id} not found`);
    }

    // Resolve age
    const birthDate = new Date(order.patient.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age -= 1;
    }

    // Format items with dynamic reference ranges
    const items = order.items.map((item) => {
      const ranges =
        (item.labTest.referenceRanges as unknown as ReferenceRange[]) || [];
      const match =
        ranges.find(
          (r) =>
            r.gender === order.patient.gender &&
            age >= (r.ageMin ?? 0) &&
            age <= (r.ageMax ?? 150),
        ) || ranges[0];

      return {
        id: item.id,
        testName: item.labTest.name,
        unit: match?.unit ?? 'g/dL',
        refLow: match?.low ?? 0,
        refHigh: match?.high ?? 100,
        criticalLow: match?.criticalLow ?? 0,
        criticalHigh: match?.criticalHigh ?? 200,
        value: item.result
          ? Number.parseFloat(item.result.resultValue)
          : undefined,
      };
    });

    return {
      id: order.id,
      orderNo: order.orderNo,
      patientName: `${order.patient.firstName} ${order.patient.lastName}`,
      mrn: order.patient.mrn,
      orderedBy: order.orderedBy.fullName,
      orderedAt: order.orderedAt.toISOString(),
      priority: order.priority,
      status: order.status,
      clinicalNotes: order.clinicalNotes ?? undefined,
      items,
    };
  }

  async collectSpecimen(id: string, dto: CollectSpecimenDto, userId: string) {
    const order = await this.prisma.labOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Lab order ${id} not found`);
    }

    if (order.status !== 'ORDERED') {
      throw new BadRequestException(
        `Cannot collect specimen for order with status ${order.status}`,
      );
    }

    const collectedAt = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.labOrder.update({
        where: { id },
        data: {
          status: LabOrderStatus.SPECIMEN_COLLECTED,
          collectedAt,
        },
      });

      for (const item of order.items) {
        const barcode =
          dto.specimenBarcode ?? `BC-LAB-${randomInt(100000, 999999)}`;
        await tx.labOrderItem.update({
          where: { id: item.id },
          data: { specimenBarcode: barcode },
        });
      }
    });

    const updated = await this.findOne(id);

    await this.audit.create({
      userId,
      action: 'COLLECT_SPECIMEN',
      module: 'LABORATORY',
      resourceId: id,
      newData: updated,
    });

    return updated;
  }

  async saveResults(id: string, dto: SaveLabResultsDto, userId: string) {
    const order = await this.prisma.labOrder.findUnique({
      where: { id },
      include: {
        patient: { select: { dateOfBirth: true, gender: true } },
        items: { include: { labTest: true } },
      },
    });

    if (!order) {
      throw new NotFoundException(`Lab order ${id} not found`);
    }

    if (
      order.status !== 'SPECIMEN_COLLECTED' &&
      order.status !== 'IN_PROCESS' &&
      order.status !== 'RESULTED'
    ) {
      throw new BadRequestException(
        `Cannot save results for order with status ${order.status}`,
      );
    }

    // Resolve age
    const birthDate = new Date(order.patient.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age -= 1;
    }

    await this.prisma.$transaction(async (tx) => {
      for (const res of dto.results) {
        const item = order.items.find((i) => i.id === res.labOrderItemId);
        if (!item) {
          throw new NotFoundException(
            `LabOrderItem ${res.labOrderItemId} not found in this order`,
          );
        }

        const ranges =
          (item.labTest.referenceRanges as unknown as ReferenceRange[]) || [];
        const match =
          ranges.find(
            (r) =>
              r.gender === order.patient.gender &&
              age >= (r.ageMin ?? 0) &&
              age <= (r.ageMax ?? 150),
          ) || ranges[0];

        const valueNum = Number.parseFloat(res.value);
        const isCritical = match
          ? valueNum <= match.criticalLow || valueNum >= match.criticalHigh
          : false;
        const isAbnormal = match
          ? valueNum < match.low || valueNum > match.high
          : false;

        await tx.labResult.upsert({
          where: { labOrderItemId: item.id },
          update: {
            resultValue: res.value,
            unit: match?.unit,
            referenceRangeLow: match?.low,
            referenceRangeHigh: match?.high,
            isAbnormal,
            isCritical,
            resultedAt: new Date(),
            performedById: userId,
          },
          create: {
            labOrderItemId: item.id,
            patientId: order.patientId,
            resultValue: res.value,
            unit: match?.unit,
            referenceRangeLow: match?.low,
            referenceRangeHigh: match?.high,
            isAbnormal,
            isCritical,
            resultedAt: new Date(),
            performedById: userId,
          },
        });
      }

      await tx.labOrder.update({
        where: { id },
        data: {
          status: LabOrderStatus.RESULTED,
          resultedAt: new Date(),
        },
      });
    });

    const updated = await this.findOne(id);

    await this.audit.create({
      userId,
      action: 'SAVE_LAB_RESULTS',
      module: 'LABORATORY',
      resourceId: id,
      newData: updated,
    });

    return updated;
  }

  async verifyResults(id: string, userId: string) {
    const order = await this.prisma.labOrder.findUnique({
      where: { id },
      include: { items: { include: { result: true } } },
    });

    if (!order) {
      throw new NotFoundException(`Lab order ${id} not found`);
    }

    if (order.status !== 'RESULTED') {
      throw new BadRequestException(
        `Cannot verify results for order with status ${order.status}`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.labOrder.update({
        where: { id },
        data: {
          status: LabOrderStatus.VERIFIED,
          resultedAt: new Date(),
        },
      });

      for (const item of order.items) {
        if (item.result) {
          await tx.labResult.update({
            where: { id: item.result.id },
            data: {
              verifiedById: userId,
              verifiedAt: new Date(),
            },
          });
        }
      }
    });

    const updated = await this.findOne(id);

    await this.audit.create({
      userId,
      action: 'VERIFY_LAB_RESULTS',
      module: 'LABORATORY',
      resourceId: id,
      newData: updated,
    });

    return updated;
  }

  async cancelOrder(id: string, userId: string) {
    const order = await this.prisma.labOrder.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException(`Lab order ${id} not found`);
    }

    if (order.status === 'VERIFIED' || order.status === 'CANCELLED') {
      throw new BadRequestException(
        `Cannot cancel order with status ${order.status}`,
      );
    }

    await this.prisma.labOrder.update({
      where: { id },
      data: { status: LabOrderStatus.CANCELLED },
    });

    const updated = await this.findOne(id);

    await this.audit.create({
      userId,
      action: 'CANCEL_LAB_ORDER',
      module: 'LABORATORY',
      resourceId: id,
      newData: updated,
    });

    return updated;
  }
}
