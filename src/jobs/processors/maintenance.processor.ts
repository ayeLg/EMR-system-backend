import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationService } from '@/modules/notifications/notification.service';
import { JOB, QUEUE } from '../jobs.constants';

const DAY = 24 * 60 * 60 * 1000;

@Processor(QUEUE.MAINTENANCE)
export class MaintenanceProcessor extends WorkerHost {
  private readonly logger = new Logger(MaintenanceProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case JOB.RX_EXPIRY:
        return this.expirePrescriptions();
      case JOB.INVOICE_OVERDUE:
        return this.markOverdueInvoices();
      case JOB.DRUG_LOW_STOCK:
        return this.alertLowStock();
      case JOB.DRUG_EXPIRY:
        return this.alertDrugExpiry();
    }
  }

  /** PENDING prescriptions uncollected for 7 days → EXPIRED. */
  private async expirePrescriptions(): Promise<void> {
    const cutoff = new Date(Date.now() - 7 * DAY);
    const res = await this.prisma.prescription.updateMany({
      where: { status: 'PENDING', prescribedAt: { lte: cutoff } },
      data: { status: 'EXPIRED' },
    });
    if (res.count)
      this.logger.log(`Expired ${res.count} uncollected prescriptions`);
  }

  /** Issued/partially-paid invoices past due date → OVERDUE. */
  private async markOverdueInvoices(): Promise<void> {
    const res = await this.prisma.invoice.updateMany({
      where: {
        status: { in: ['ISSUED', 'PARTIALLY_PAID'] },
        dueDate: { lt: new Date() },
      },
      data: { status: 'OVERDUE' },
    });
    if (res.count) this.logger.log(`Marked ${res.count} invoices OVERDUE`);
  }

  /** quantity_on_hand <= reorder_level → notify pharmacy admins. */
  private async alertLowStock(): Promise<void> {
    const inventory = await this.prisma.drugInventory.findMany({
      include: { medication: { select: { genericName: true } } },
    });
    const low = inventory.filter((i) => i.quantityOnHand <= i.reorderLevel);
    if (low.length === 0) return;

    const names = low.map((i) => i.medication.genericName).join(', ');
    await this.notifyPharmacists(
      'Low drug stock',
      `${low.length} item(s) at/below reorder level: ${names}`,
    );
  }

  /** Batches expiring within 30 days → notify pharmacy admins. */
  private async alertDrugExpiry(): Promise<void> {
    const cutoff = new Date(Date.now() + 30 * DAY);
    const expiring = await this.prisma.drugInventory.findMany({
      where: { expiryDate: { lte: cutoff } },
      include: { medication: { select: { genericName: true } } },
    });
    if (expiring.length === 0) return;

    const names = expiring.map((i) => i.medication.genericName).join(', ');
    await this.notifyPharmacists(
      'Drug expiry alert',
      `${expiring.length} batch(es) expiring within 30 days: ${names}`,
    );
  }

  private async notifyPharmacists(title: string, body: string): Promise<void> {
    const pharmacists = await this.prisma.user.findMany({
      where: { status: 'ACTIVE', role: { code: 'PHARMACIST' } },
      select: { id: true },
    });
    for (const user of pharmacists) {
      await this.notifications.createNotification({
        userId: user.id,
        type: 'SYSTEM_ALERT',
        title,
        body,
        refType: 'pharmacy',
      });
    }
  }
}
