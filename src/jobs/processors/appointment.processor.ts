import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '@/prisma/prisma.service';
import { SmsService } from '@/common/messaging/sms.service';
import { AppointmentJobData, JOB, QUEUE } from '../jobs.constants';

@Processor(QUEUE.APPOINTMENTS)
export class AppointmentProcessor extends WorkerHost {
  private readonly logger = new Logger(AppointmentProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sms: SmsService,
  ) {
    super();
  }

  async process(job: Job<AppointmentJobData>): Promise<void> {
    const { appointmentId } = job.data;
    const appt = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true },
    });
    if (!appt) return;

    if (job.name === JOB.NO_SHOW) {
      // Only the still-unattended ones flip to NO_SHOW.
      if (appt.status === 'SCHEDULED') {
        await this.prisma.appointment.update({
          where: { id: appointmentId },
          data: { status: 'NO_SHOW' },
        });
        this.logger.log(
          `Appointment ${appt.appointmentNo} auto-marked NO_SHOW`,
        );
      }
      return;
    }

    // Reminder jobs — skip if the patient already arrived/cancelled.
    if (appt.status !== 'SCHEDULED') return;
    const when = appt.scheduledAt.toISOString().replace('T', ' ').slice(0, 16);
    await this.sms.send(
      appt.patient.primaryPhone,
      `Reminder: appointment ${appt.appointmentNo} on ${when}. Please arrive 15 min early.`,
    );
  }
}
