import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { ClinicalDocsController } from './clinical-docs.controller';
import { ClinicalDocsService } from './clinical-docs.service';

@Module({
  imports: [PrismaModule],
  controllers: [ClinicalDocsController],
  providers: [ClinicalDocsService],
  exports: [ClinicalDocsService],
})
export class ClinicalDocsModule {}
