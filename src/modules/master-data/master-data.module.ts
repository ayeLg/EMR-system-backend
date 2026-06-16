import { Module } from '@nestjs/common';
import { DepartmentsModule } from './departments/departments.module';
import { InsuranceProvidersModule } from './insurance-providers/insurance-providers.module';
import { LabTestsModule } from './lab-tests/lab-tests.module';
import { MedicationsModule } from './medications/medications.module';
import { ServicesCatalogModule } from './services-catalog/services-catalog.module';
import { WardsModule } from './wards/wards.module';
import { Icd10Module } from './icd10/icd10.module';

@Module({
  imports: [
    DepartmentsModule,
    ServicesCatalogModule,
    MedicationsModule,
    LabTestsModule,
    WardsModule,
    InsuranceProvidersModule,
    Icd10Module,
  ],
})
export class MasterDataModule {}
