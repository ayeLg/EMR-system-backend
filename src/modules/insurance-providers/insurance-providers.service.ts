import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  CreateInsuranceProviderDto,
  UpdateInsuranceProviderDto,
} from './dto/insurance-provider.dto';
import type { InsuranceProviderRecord } from './entities/insurance-provider.entity';
import { INSURANCE_PROVIDER_SEEDS } from './insurance-providers.seed';

/** In-memory catalog until a Prisma model is added. */
@Injectable()
export class InsuranceProvidersService implements OnModuleInit {
  private readonly providers = new Map<string, InsuranceProviderRecord>();

  onModuleInit(): void {
    if (this.providers.size > 0) return;

    for (const seed of INSURANCE_PROVIDER_SEEDS) {
      const id = randomUUID();
      this.providers.set(id, { id, ...seed });
    }
  }

  findAll(): InsuranceProviderRecord[] {
    return [...this.providers.values()].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }

  findOne(id: string): InsuranceProviderRecord {
    const row = this.providers.get(id);
    if (!row) throw new NotFoundException(`Insurance provider ${id} not found`);
    return row;
  }

  create(dto: CreateInsuranceProviderDto): InsuranceProviderRecord {
    const id = randomUUID();
    const row: InsuranceProviderRecord = {
      id,
      code: dto.code,
      name: dto.name,
      contact: dto.contact ?? null,
      isActive: true,
    };
    this.providers.set(id, row);
    return row;
  }

  update(id: string, dto: UpdateInsuranceProviderDto): InsuranceProviderRecord {
    const existing = this.findOne(id);
    const updated: InsuranceProviderRecord = { ...existing, ...dto };
    this.providers.set(id, updated);
    return updated;
  }

  remove(id: string): { deleted: boolean } {
    if (!this.providers.delete(id)) {
      throw new NotFoundException(`Insurance provider ${id} not found`);
    }
    return { deleted: true };
  }
}
