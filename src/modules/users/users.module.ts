import { Module } from '@nestjs/common';
import { RbacModule } from '@/modules/rbac/rbac.module';
import { UsersService } from './users.service';

@Module({
  imports: [RbacModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
