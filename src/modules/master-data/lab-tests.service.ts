import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { CreateLabTestDto, UpdateLabTestDto } from './dto/master-data.dto';
import { decimalToNumber } from './master-data.serializer';

@Injectable()
export class LabTestsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    const count = await this.prisma.labTest.count();
    if (count > 0) return;

    await this.prisma.labTest.createMany({
      data: [
        {
          code: 'CBC',
          name: 'Complete Blood Count',
          category: 'Hematology',
          sampleType: 'Blood',
          price: 15000,
        },
        {
          code: 'LIPID',
          name: 'Lipid panel',
          category: 'Chemistry',
          sampleType: 'Blood',
          price: 35000,
        },
        {
          code: 'UA',
          name: 'Urinalysis',
          category: 'Microbiology',
          sampleType: 'Urine',
          price: 10000,
        },
      ],
      skipDuplicates: true,
    });
  }

  async findAll() {
    const rows = await this.prisma.labTest.findMany({
      orderBy: { name: 'asc' },
    });
    return rows.map((row) => ({
      ...row,
      price: decimalToNumber(row.price),
    }));
  }

  async findOne(id: string) {
    const row = await this.prisma.labTest.findUnique({ where: { id } });
    if (!row) throw new NotFoundException(`Lab test ${id} not found`);
    return { ...row, price: decimalToNumber(row.price) };
  }

  create(dto: CreateLabTestDto) {
    return this.prisma.labTest
      .create({ data: dto })
      .then((row) => ({ ...row, price: decimalToNumber(row.price) }));
  }

  async update(id: string, dto: UpdateLabTestDto) {
    await this.findOne(id);
    const row = await this.prisma.labTest.update({ where: { id }, data: dto });
    return { ...row, price: decimalToNumber(row.price) };
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.labTest.delete({ where: { id } });
    return { deleted: true };
  }
}
