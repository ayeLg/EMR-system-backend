import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { seedIfEmpty } from '@/common/catalog/seed-if-empty';
import type { CreateWardDto, UpdateWardDto } from './dto/ward.dto';
import { WARD_SEEDS } from './wards.seed';

@Injectable()
export class WardsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await seedIfEmpty(
      () => this.prisma.ward.count(),
      async () => {
        const data: {
          code: string;
          name: string;
          departmentId: string;
          totalBeds: number;
        }[] = [];
        for (const seed of WARD_SEEDS) {
          const department = await this.prisma.department.findUnique({
            where: { code: seed.departmentCode },
          });
          if (!department) continue;
          data.push({
            code: seed.code,
            name: seed.name,
            departmentId: department.id,
            totalBeds: seed.totalBeds,
          });
        }
        if (data.length > 0) {
          await this.prisma.ward.createMany({ data, skipDuplicates: true });
        }
      },
    );
  }

  async findAll() {
    const rows = await this.prisma.ward.findMany({
      orderBy: { name: 'asc' },
      include: { department: { select: { id: true, name: true } } },
    });
    return rows.map((row) => this.serialize(row));
  }

  async findOne(id: string) {
    const row = await this.prisma.ward.findUnique({
      where: { id },
      include: { department: { select: { id: true, name: true } } },
    });
    if (!row) throw new NotFoundException(`Ward ${id} not found`);
    return this.serialize(row);
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

  private serialize(row: {
    id: string;
    code: string;
    name: string;
    departmentId: string;
    department: { name: string };
    totalBeds: number;
    isActive: boolean;
  }) {
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
}
