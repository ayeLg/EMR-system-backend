import { Module } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { InsuranceProvidersService } from './insurance-providers.service';
import { LabTestsService } from './lab-tests.service';
import { MasterDataController } from './master-data.controller';
import { MedicationsService } from './medications.service';
import { ServicesCatalogService } from './services-catalog.service';
import { WardsService } from './wards.service';

@Module({
  controllers: [MasterDataController],
  providers: [
    DepartmentsService,
    ServicesCatalogService,
    MedicationsService,
    LabTestsService,
    WardsService,
    InsuranceProvidersService,
  ],
  exports: [
    DepartmentsService,
    ServicesCatalogService,
    MedicationsService,
    LabTestsService,
    WardsService,
    InsuranceProvidersService,
  ],
})
export class MasterDataModule {}
