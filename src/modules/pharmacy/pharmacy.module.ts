import { Module } from '@nestjs/common';
import { AuditModule } from '@/modules/audit/audit.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { PharmacyController } from './pharmacy.controller';
import { PharmacyService } from './pharmacy.service';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [PharmacyController],
  providers: [PharmacyService],
  exports: [PharmacyService],
})
export class PharmacyModule {}
