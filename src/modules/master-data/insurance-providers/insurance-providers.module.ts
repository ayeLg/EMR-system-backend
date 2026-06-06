import { Module } from '@nestjs/common';
import { InsuranceProvidersController } from './insurance-providers.controller';
import { InsuranceProvidersService } from './insurance-providers.service';

@Module({
  controllers: [InsuranceProvidersController],
  providers: [InsuranceProvidersService],
  exports: [InsuranceProvidersService],
})
export class InsuranceProvidersModule {}
