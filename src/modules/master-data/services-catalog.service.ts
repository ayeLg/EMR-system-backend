import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { CreateServiceDto, UpdateServiceDto } from './dto/master-data.dto';
import { decimalToNumber } from './master-data.serializer';

@Injectable()
export class ServicesCatalogService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    const count = await this.prisma.service.count();
    if (count > 0) return;

    await this.prisma.service.createMany({
      data: [
        {
          code: 'CONSULT_OPD',
          name: 'OPD Consultation',
          category: 'Consultation',
          price: 30000,
          taxRate: 0,
        },
        {
          code: 'ECG',
          name: 'ECG',
          category: 'Procedure',
          price: 25000,
          taxRate: 0,
        },
        {
          code: 'DRESSING',
          name: 'Wound dressing',
          category: 'Procedure',
          price: 8000,
          taxRate: 0,
        },
      ],
      skipDuplicates: true,
    });
  }

  async findAll() {
    const rows = await this.prisma.service.findMany({
      orderBy: { name: 'asc' },
    });
    return rows.map((row) => ({
      ...row,
      price: decimalToNumber(row.price),
      taxRate: decimalToNumber(row.taxRate),
    }));
  }

  async findOne(id: string) {
    const row = await this.prisma.service.findUnique({ where: { id } });
    if (!row) throw new NotFoundException(`Service ${id} not found`);
    return {
      ...row,
      price: decimalToNumber(row.price),
      taxRate: decimalToNumber(row.taxRate),
    };
  }

  create(dto: CreateServiceDto) {
    return this.prisma.service
      .create({
        data: {
          ...dto,
          category: dto.category,
          taxRate: dto.taxRate ?? 0,
        },
      })
      .then((row) => ({
        ...row,
        price: decimalToNumber(row.price),
        taxRate: decimalToNumber(row.taxRate),
      }));
  }

  async update(id: string, dto: UpdateServiceDto) {
    await this.findOne(id);
    const row = await this.prisma.service.update({ where: { id }, data: dto });
    return {
      ...row,
      price: decimalToNumber(row.price),
      taxRate: decimalToNumber(row.taxRate),
    };
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.service.delete({ where: { id } });
    return { deleted: true };
  }
}
