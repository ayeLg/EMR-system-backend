import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { CreateDepartmentDto } from './dto/master-data.dto';
import type { UpdateDepartmentDto } from './dto/master-data.dto';

@Injectable()
export class DepartmentsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    const count = await this.prisma.department.count();
    if (count > 0) return;

    await this.prisma.department.createMany({
      data: [
        { code: 'CARDIO', name: 'Cardiology', description: 'Heart & vascular' },
        {
          code: 'GEN_MED',
          name: 'General Medicine',
          description: 'Internal medicine',
        },
        { code: 'PEDS', name: 'Pediatrics', description: 'Child health' },
        { code: 'ORTHO', name: 'Orthopedics', description: 'Bone & joint' },
      ],
      skipDuplicates: true,
    });
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
