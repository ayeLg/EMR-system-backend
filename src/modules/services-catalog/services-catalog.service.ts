import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { decimalToNumber } from '@/common/catalog/decimal.serializer';
import { seedIfEmpty } from '@/common/catalog/seed-if-empty';
import type { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';
import { SERVICE_SEEDS } from './services-catalog.seed';

@Injectable()
export class ServicesCatalogService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await seedIfEmpty(
      () => this.prisma.service.count(),
      () =>
        this.prisma.service.createMany({
          data: [...SERVICE_SEEDS],
          skipDuplicates: true,
        }),
    );
  }

  async findAll() {
    const rows = await this.prisma.service.findMany({
      orderBy: { name: 'asc' },
    });
    return rows.map((row) => this.serialize(row));
  }

  async findOne(id: string) {
    const row = await this.prisma.service.findUnique({ where: { id } });
    if (!row) throw new NotFoundException(`Service ${id} not found`);
    return this.serialize(row);
  }

  async create(dto: CreateServiceDto) {
    const row = await this.prisma.service.create({
      data: {
        ...dto,
        taxRate: dto.taxRate ?? 0,
      },
    });
    return this.serialize(row);
  }

  async update(id: string, dto: UpdateServiceDto) {
    await this.findOne(id);
    const row = await this.prisma.service.update({ where: { id }, data: dto });
    return this.serialize(row);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.service.delete({ where: { id } });
    return { deleted: true };
  }

  private serialize<T extends { price: unknown; taxRate: unknown }>(row: T) {
    return {
      ...row,
      price: decimalToNumber(row.price),
      taxRate: decimalToNumber(row.taxRate),
    };
  }
}
