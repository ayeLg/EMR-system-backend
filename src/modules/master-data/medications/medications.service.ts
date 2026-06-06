import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { seedIfEmpty } from '@/common/catalog/seed-if-empty';
import type {
  CreateMedicationDto,
  UpdateMedicationDto,
} from './dto/medication.dto';
import { MEDICATION_SEEDS } from './medications.seed';

@Injectable()
export class MedicationsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await seedIfEmpty(
      () => this.prisma.medication.count(),
      () =>
        this.prisma.medication.createMany({
          data: [...MEDICATION_SEEDS],
          skipDuplicates: true,
        }),
    );
  }

  findAll() {
    return this.prisma.medication.findMany({ orderBy: { genericName: 'asc' } });
  }

  async findOne(id: string) {
    const row = await this.prisma.medication.findUnique({ where: { id } });
    if (!row) throw new NotFoundException(`Medication ${id} not found`);
    return row;
  }

  create(dto: CreateMedicationDto) {
    return this.prisma.medication.create({
      data: {
        ...dto,
        category: dto.category ?? 'General',
      },
    });
  }

  async update(id: string, dto: UpdateMedicationDto) {
    await this.findOne(id);
    return this.prisma.medication.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.medication.delete({ where: { id } });
    return { deleted: true };
  }
}
