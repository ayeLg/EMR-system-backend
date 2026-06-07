import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditLogsController } from './audit.controller';

@Module({
  controllers: [AuditLogsController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
