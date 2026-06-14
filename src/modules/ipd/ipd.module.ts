import { Module } from '@nestjs/common';
import { AuditModule } from '@/modules/audit/audit.module';
import { IpdController } from './ipd.controller';
import { IpdService } from './ipd.service';

@Module({
  imports: [AuditModule],
  controllers: [IpdController],
  providers: [IpdService],
  exports: [IpdService],
})
export class IpdModule {}
