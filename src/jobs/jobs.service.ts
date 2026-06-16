import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JOB, QUEUE } from './jobs.constants';

const ONE_HOUR = 60 * 60 * 1000;

/**
 * Producer + scheduler for all background jobs.
 *
 * Per-entity jobs (reminders, no-show, escalation) are enqueued with a delay by
 * the owning service. Daily maintenance jobs are registered once at boot as
 * idempotent job-schedulers (cron).
 */
@Injectable()
export class JobsService implements OnModuleInit {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @InjectQueue(QUEUE.APPOINTMENTS) private readonly appointments: Queue,
    @InjectQueue(QUEUE.MAINTENANCE) private readonly maintenance: Queue,
    @InjectQueue(QUEUE.LAB) private readonly lab: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    // Idempotent daily schedulers (re-running upsert keeps a single schedule).
    await this.maintenance.upsertJobScheduler(
      JOB.RX_EXPIRY,
      { pattern: '0 7 * * *' },
      { name: JOB.RX_EXPIRY },
    );
    await this.maintenance.upsertJobScheduler(
      JOB.DRUG_LOW_STOCK,
      { pattern: '0 8 * * *' },
      { name: JOB.DRUG_LOW_STOCK },
    );
    await this.maintenance.upsertJobScheduler(
      JOB.DRUG_EXPIRY,
      { pattern: '0 8 * * *' },
      { name: JOB.DRUG_EXPIRY },
    );
    await this.maintenance.upsertJobScheduler(
      JOB.INVOICE_OVERDUE,
      { pattern: '0 1 * * *' },
      { name: JOB.INVOICE_OVERDUE },
    );
    this.logger.log('Daily maintenance job-schedulers registered');
  }

  /** T-24h SMS + T-1h reminder, scheduled at booking time. */
  async scheduleAppointmentReminders(
    appointmentId: string,
    scheduledAt: Date,
  ): Promise<void> {
    const now = Date.now();
    const delay24 = scheduledAt.getTime() - 24 * ONE_HOUR - now;
    const delay1 = scheduledAt.getTime() - ONE_HOUR - now;

    if (delay24 > 0) {
      await this.appointments.add(
        JOB.REMINDER_24H,
        { appointmentId },
        { delay: delay24, jobId: `rem24-${appointmentId}` },
      );
    }
    if (delay1 > 0) {
      await this.appointments.add(
        JOB.REMINDER_1H,
        { appointmentId },
        { delay: delay1, jobId: `rem1-${appointmentId}` },
      );
    }
  }

  /** Auto NO_SHOW check 30 min after the scheduled time. */
  async scheduleNoShow(
    appointmentId: string,
    scheduledAt: Date,
  ): Promise<void> {
    const delay = scheduledAt.getTime() + 30 * 60 * 1000 - Date.now();
    await this.appointments.add(
      JOB.NO_SHOW,
      { appointmentId },
      { delay: Math.max(delay, 0), jobId: `noshow-${appointmentId}` },
    );
  }

  /** Cancel reminder/no-show jobs when an appointment is cancelled/rescheduled. */
  async cancelAppointmentJobs(appointmentId: string): Promise<void> {
    await Promise.all([
      this.appointments.remove(`rem24-${appointmentId}`).catch(() => undefined),
      this.appointments.remove(`rem1-${appointmentId}`).catch(() => undefined),
      this.appointments
        .remove(`noshow-${appointmentId}`)
        .catch(() => undefined),
    ]);
  }

  /** Escalate an unacknowledged critical lab value after 30 min. */
  async scheduleLabCriticalEscalation(labResultId: string): Promise<void> {
    await this.lab.add(
      JOB.LAB_CRITICAL_ESCALATION,
      { labResultId },
      { delay: 30 * 60 * 1000, jobId: `labesc-${labResultId}` },
    );
  }
}
