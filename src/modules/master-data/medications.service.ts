import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type {
  CreateMedicationDto,
  UpdateMedicationDto,
} from './dto/master-data.dto';

@Injectable()
export class MedicationsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    const count = await this.prisma.medication.count();
    if (count > 0) return;

    await this.prisma.medication.createMany({
      data: [
        {
          code: 'MED-PARA',
          genericName: 'Paracetamol',
          category: 'Analgesic',
          dosageForm: 'Tablet',
          strength: '500mg',
          unit: 'tablet',
        },
        {
          code: 'MED-AMLO',
          genericName: 'Amlodipine',
          category: 'Cardiovascular',
          dosageForm: 'Tablet',
          strength: '5mg',
          unit: 'tablet',
        },
        {
          code: 'MED-AMOX',
          genericName: 'Amoxicillin',
          category: 'Antibiotic',
          dosageForm: 'Capsule',
          strength: '250mg',
          unit: 'capsule',
        },
      ],
      skipDuplicates: true,
    });
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
