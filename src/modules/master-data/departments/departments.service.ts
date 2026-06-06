import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { seedIfEmpty } from '@/common/catalog/seed-if-empty';
import { DEPARTMENT_SEEDS } from './departments.seed';
import type {
  CreateDepartmentDto,
  UpdateDepartmentDto,
} from './dto/department.dto';

@Injectable()
export class DepartmentsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await seedIfEmpty(
      () => this.prisma.department.count(),
      () =>
        this.prisma.department.createMany({
          data: [...DEPARTMENT_SEEDS],
          skipDuplicates: true,
        }),
    );
  }

  findAll() {
    return this.prisma.department.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const row = await this.prisma.department.findUnique({ where: { id } });
    if (!row) throw new NotFoundException(`Department ${id} not found`);
    return row;
  }

  create(dto: CreateDepartmentDto) {
    return this.prisma.department.create({ data: dto });
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    await this.findOne(id);
    return this.prisma.department.update({ where: { id }, data: dto });
  }

  async setIsActive(id: string, isActive: boolean) {
    await this.findOne(id);
    return this.prisma.department.update({
      where: { id },
      data: { isActive },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.department.delete({ where: { id } });
    return { deleted: true };
  }
}
