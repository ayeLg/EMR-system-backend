import { Module } from '@nestjs/common';
import { RbacService } from '@/authorization/rbac/rbac.service';
import { RbacController } from './rbac.controller';

@Module({
  controllers: [RbacController],
  providers: [RbacService],
  exports: [RbacService],
})
export class RbacModule {}
