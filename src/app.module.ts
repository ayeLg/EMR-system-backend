import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import configuration from '@/config/configuration';
import { validate } from '@/config/env.validation';
import { CaslModule } from '@/casl/casl.module';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PoliciesGuard } from '@/common/guards/policies.guard';
import { AuthModule } from '@/auth/auth.module';
import { HealthModule } from '@/health/health.module';
import { PatientsModule } from '@/patients/patients.module';
import { UsersModule } from '@/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
    }),
    CaslModule,
    UsersModule,
    AuthModule,
    HealthModule,
    PatientsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PoliciesGuard },
  ],
})
export class AppModule {}
