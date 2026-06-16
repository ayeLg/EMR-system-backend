import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationService } from '@/modules/notifications/notification.service';
import { AuditService } from '@/modules/audit/audit.service';
import { LabEscalationJobData, JOB, QUEUE } from '../jobs.constants';

@Processor(QUEUE.LAB)
export class LabProcessor extends WorkerHost {
  private readonly logger = new Logger(LabProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
    private readonly audit: AuditService,
  ) {
    super();
  }

  async process(job: Job<LabEscalationJobData>): Promise<void> {
    if (job.name !== JOB.LAB_CRITICAL_ESCALATION) return;
    const { labResultId } = job.data;

    const result = await this.prisma.labResult.findUnique({
      where: { id: labResultId },
      include: {
        labOrderItem: {
          include: {
            labOrder: { select: { orderNo: true, orderedById: true } },
          },
        },
      },
    });
    if (!result || !result.isCritical) return;

    // Acknowledged within the 30-min window → no escalation needed.
    if (result.criticalAckAt) return;

    const order = result.labOrderItem.labOrder;

    // Escalate to department head — no dept-head column yet, so fall back to
    // SUPER_ADMIN + re-notify the ordering doctor. (TODO: add Department.headId.)
    const admins = await this.prisma.user.findMany({
      where: { status: 'ACTIVE', role: { code: 'SUPER_ADMIN' } },
      select: { id: true },
    });
    const recipients = new Set<string>([
      order.orderedById,
      ...admins.map((a) => a.id),
    ]);

    for (const userId of recipients) {
      await this.notifications.createNotification({
        userId,
        type: 'CRITICAL_VALUE',
        title: 'Critical lab value NOT acknowledged',
        body: `Critical result for order ${order.orderNo} was not acknowledged within 30 minutes. Escalated.`,
        refType: 'lab_result',
        refId: result.id,
      });
    }

    await this.audit.create({
      userId: order.orderedById,
      action: 'CRITICAL_VALUE_ESCALATION',
      module: 'LABORATORY',
      resourceId: result.id,
      newData: { orderNo: order.orderNo, escalatedTo: [...recipients] },
    });
    this.logger.warn(`Critical lab value escalated: order ${order.orderNo}`);
  }
}
