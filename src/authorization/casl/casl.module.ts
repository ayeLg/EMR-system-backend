import { Global, Module } from '@nestjs/common';
import { RbacModule } from '@/modules/rbac/rbac.module';
import { CaslAbilityFactory } from './casl-ability.factory';

@Global()
@Module({
  imports: [RbacModule],
  providers: [CaslAbilityFactory],
  exports: [CaslAbilityFactory],
})
export class CaslModule {}
