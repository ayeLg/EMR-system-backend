import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class Icd10Service {
  constructor(private readonly prisma: PrismaService) {}

  /** Typeahead search over code + description (active codes only). */
  async search(query?: string, limit = 20) {
    const where: Prisma.Icd10CodeWhereInput = { isActive: true };
    const q = query?.trim();
    if (q) {
      where.OR = [
        { code: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }
    return this.prisma.icd10Code.findMany({
      where,
      orderBy: { code: 'asc' },
      take: limit,
    });
  }

  findByCode(code: string) {
    return this.prisma.icd10Code.findUnique({ where: { code } });
  }
}
