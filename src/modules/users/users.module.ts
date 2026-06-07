import { Module } from '@nestjs/common';
import { RbacModule } from '@/modules/rbac/rbac.module';
import { AuditModule } from '@/modules/audit/audit.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [RbacModule, AuditModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
