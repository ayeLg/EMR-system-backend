import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import configuration from '@/config/configuration';
import { validate } from '@/config/env.validation';
import { PrismaModule } from '@/prisma/prisma.module';
import { SecurityModule } from '@/common/security/security.module';
import { CaslModule } from '@/authorization/casl/casl.module';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PoliciesGuard } from '@/common/guards/policies.guard';
import { AuthModule } from '@/auth/auth.module';
import { HealthModule } from '@/modules/health/health.module';
import { MasterDataModule } from '@/modules/master-data/master-data.module';
import { RbacModule } from '@/modules/rbac/rbac.module';
import { PatientsModule } from '@/modules/patients/patients.module';
import { UsersModule } from '@/modules/users/users.module';
import { AuditModule } from '@/modules/audit/audit.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { EncountersModule } from './modules/encounters/encounters.module';
import { VitalsModule } from './modules/vitals/vitals.module';
import { DoctorSchedulesModule } from '@/modules/doctor-schedules/doctor-schedules.module';
import { PharmacyModule } from '@/modules/pharmacy/pharmacy.module';
import { LaboratoryModule } from '@/modules/laboratory/laboratory.module';
import { RadiologyModule } from '@/modules/radiology/radiology.module';
import { IpdModule } from '@/modules/ipd/ipd.module';
import { ClinicalDocsModule } from '@/modules/clinical-docs/clinical-docs.module';
import { BillingModule } from '@/modules/billing/billing.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
      expandVariables: true,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('throttle.ttl', 60_000),
            limit: config.get<number>('throttle.limit', 100),
          },
        ],
      }),
    }),
    PrismaModule,
    SecurityModule,
    CaslModule,
    UsersModule,
    AuthModule,
    HealthModule,
    PatientsModule,
    MasterDataModule,
    RbacModule,
    AuditModule,
    AppointmentsModule,
    EncountersModule,
    VitalsModule,
    DoctorSchedulesModule,
    PharmacyModule,
    LaboratoryModule,
    RadiologyModule,
    IpdModule,
    ClinicalDocsModule,
    BillingModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PoliciesGuard },
  ],
})
export class AppModule {}
