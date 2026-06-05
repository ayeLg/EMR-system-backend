import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { CreateWardDto, UpdateWardDto } from './dto/master-data.dto';

@Injectable()
export class WardsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    const count = await this.prisma.ward.count();
    if (count > 0) return;

    const genMed = await this.prisma.department.findUnique({
      where: { code: 'GEN_MED' },
    });
    const cardio = await this.prisma.department.findUnique({
      where: { code: 'CARDIO' },
    });
    const peds = await this.prisma.department.findUnique({
      where: { code: 'PEDS' },
    });
    if (!genMed || !cardio || !peds) return;

    await this.prisma.ward.createMany({
      data: [
        {
          code: 'WARD-A',
          name: 'Ward A (General)',
          departmentId: genMed.id,
          totalBeds: 24,
        },
        {
          code: 'ICU',
          name: 'Intensive Care Unit',
          departmentId: cardio.id,
          totalBeds: 8,
        },
        {
          code: 'PEDS-W',
          name: 'Pediatric Ward',
          departmentId: peds.id,
          totalBeds: 16,
        },
      ],
      skipDuplicates: true,
    });
  }

  async findAll() {
    const rows = await this.prisma.ward.findMany({
      orderBy: { name: 'asc' },
      include: { department: { select: { id: true, name: true } } },
    });
    return rows.map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      departmentId: row.departmentId,
      department: row.department.name,
      totalBeds: row.totalBeds,
      isActive: row.isActive,
    }));
  }

  async findOne(id: string) {
    const row = await this.prisma.ward.findUnique({
      where: { id },
      include: { department: { select: { id: true, name: true } } },
    });
    if (!row) throw new NotFoundException(`Ward ${id} not found`);
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      departmentId: row.departmentId,
      department: row.department.name,
      totalBeds: row.totalBeds,
      isActive: row.isActive,
    };
  }

  async create(dto: CreateWardDto) {
    await this.prisma.department.findUniqueOrThrow({
      where: { id: dto.departmentId },
    });
    const row = await this.prisma.ward.create({ data: dto });
    return this.findOne(row.id);
  }

  async update(id: string, dto: UpdateWardDto) {
    await this.findOne(id);
    if (dto.departmentId) {
      await this.prisma.department.findUniqueOrThrow({
        where: { id: dto.departmentId },
      });
    }
    await this.prisma.ward.update({ where: { id }, data: dto });
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.ward.delete({ where: { id } });
    return { deleted: true };
  }
}
