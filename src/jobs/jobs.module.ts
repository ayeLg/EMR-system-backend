import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { NotificationModule } from '@/modules/notifications/notification.module';
import { AuditModule } from '@/modules/audit/audit.module';
import { JobsService } from './jobs.service';
import { QUEUE } from './jobs.constants';
import { AppointmentProcessor } from './processors/appointment.processor';
import { MaintenanceProcessor } from './processors/maintenance.processor';
import { LabProcessor } from './processors/lab.processor';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('redis.host', 'localhost'),
          port: config.get<number>('redis.port', 6379),
        },
      }),
    }),
    BullModule.registerQueue(
      { name: QUEUE.APPOINTMENTS },
      { name: QUEUE.MAINTENANCE },
      { name: QUEUE.LAB },
    ),
    NotificationModule,
    AuditModule,
  ],
  providers: [
    JobsService,
    AppointmentProcessor,
    MaintenanceProcessor,
    LabProcessor,
  ],
  exports: [JobsService],
})
export class JobsModule {}
