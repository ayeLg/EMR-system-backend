import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  CreateInsuranceProviderDto,
  UpdateInsuranceProviderDto,
} from './dto/master-data.dto';

export interface InsuranceProviderRecord {
  id: string;
  code: string;
  name: string;
  contact?: string | null;
  isActive: boolean;
}

@Injectable()
export class InsuranceProvidersService implements OnModuleInit {
  private readonly providers = new Map<string, InsuranceProviderRecord>();

  onModuleInit(): void {
    if (this.providers.size > 0) return;

    const seeds: Omit<InsuranceProviderRecord, 'id'>[] = [
      { code: 'AYA', name: 'AYA SOMPO', contact: '01-555111', isActive: true },
      {
        code: 'GGI',
        name: 'Grand Guardian',
        contact: '01-555222',
        isActive: true,
      },
      {
        code: 'IKBZ',
        name: 'IKBZ Insurance',
        contact: '01-555333',
        isActive: true,
      },
    ];

    for (const seed of seeds) {
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
