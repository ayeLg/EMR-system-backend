import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

/**
 * Wraps the generated Prisma client and ties its connection lifecycle to the
 * Nest application lifecycle. Inject this anywhere a repository would be used.
 *
 * Prisma 7: the connection is provided via the pg driver adapter. The URL comes
 * from config (`database.url`), which ConfigModule composes from the DB_* parts
 * (expandVariables).
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService) {
    super({ adapter: new PrismaPg(config.getOrThrow<string>('database.url')) });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Prisma connected to database');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Prisma disconnected from database');
  }
}
