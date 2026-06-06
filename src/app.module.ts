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
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PoliciesGuard },
  ],
})
export class AppModule {}
