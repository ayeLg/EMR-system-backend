import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { decimalToNumber } from '@/common/catalog/decimal.serializer';
import { seedIfEmpty } from '@/common/catalog/seed-if-empty';
import type { CreateLabTestDto, UpdateLabTestDto } from './dto/lab-test.dto';
import { LAB_TEST_SEEDS } from './lab-tests.seed';

@Injectable()
export class LabTestsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await seedIfEmpty(
      () => this.prisma.labTest.count(),
      () =>
        this.prisma.labTest.createMany({
          data: [...LAB_TEST_SEEDS],
          skipDuplicates: true,
        }),
    );
  }

  async findAll() {
    const rows = await this.prisma.labTest.findMany({
      orderBy: { name: 'asc' },
    });
    return rows.map((row) => this.serialize(row));
  }

  async findOne(id: string) {
    const row = await this.prisma.labTest.findUnique({ where: { id } });
    if (!row) throw new NotFoundException(`Lab test ${id} not found`);
    return this.serialize(row);
  }

  async create(dto: CreateLabTestDto) {
    const row = await this.prisma.labTest.create({ data: dto });
    return this.serialize(row);
  }

  async update(id: string, dto: UpdateLabTestDto) {
    await this.findOne(id);
    const row = await this.prisma.labTest.update({ where: { id }, data: dto });
    return this.serialize(row);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.labTest.delete({ where: { id } });
    return { deleted: true };
  }

  private serialize<T extends { price: unknown }>(row: T) {
    return { ...row, price: decimalToNumber(row.price) };
  }
}
