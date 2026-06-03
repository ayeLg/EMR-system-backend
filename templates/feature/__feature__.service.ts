import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Create__Feature__Dto } from './dto/create-__feature__.dto';
import { List__Feature__Dto } from './dto/list-__feature__.dto';
import { Update__Feature__Dto } from './dto/update-__feature__.dto';
import type { __Feature__ } from './entities/__feature__.entity';

interface PrismaCrudDelegate {
  findMany(args: Record<string, unknown>): Promise<Record<string, unknown>[]>;
  findUnique(
    args: Record<string, unknown>,
  ): Promise<Record<string, unknown> | null>;
  count(args: Record<string, unknown>): Promise<number>;
  create(args: Record<string, unknown>): Promise<Record<string, unknown>>;
  update(args: Record<string, unknown>): Promise<Record<string, unknown>>;
  delete(args: Record<string, unknown>): Promise<Record<string, unknown>>;
}

export interface Paginated__Feature__Response {
  data: __Feature__[];
  meta: {
    page: number;
    limit: number;
    total: number;
    pageCount: number;
  };
}

@Injectable()
export class __Feature__Service {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: List__Feature__Dto = {},
  ): Promise<Paginated__Feature__Response> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.buildSearchWhere(query.search);
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      this.repo.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.repo.count({ where }),
    ]);

    return {
      data: rows.map((row) => row as __Feature__),
      meta: {
        page,
        limit,
        total,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<__Feature__> {
    const row = await this.repo.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException(`__Feature__ ${id} not found`);
    }
    return row as __Feature__;
  }

  async create(dto: Create__Feature__Dto): Promise<__Feature__> {
    const row = await this.repo.create({
      data: { ...dto },
    });
    return row as __Feature__;
  }

  async update(id: string, dto: Update__Feature__Dto): Promise<__Feature__> {
    await this.findOne(id);
    const row = await this.repo.update({
      where: { id },
      data: { ...dto },
    });
    return row as __Feature__;
  }

  async remove(id: string): Promise<{ deleted: true }> {
    await this.findOne(id);
    await this.repo.delete({ where: { id } });
    return { deleted: true };
  }

  private get repo(): PrismaCrudDelegate {
    return this.prisma[
      '__prisma__' as keyof PrismaService
    ] as unknown as PrismaCrudDelegate;
  }

  private buildSearchWhere(_search?: string): Record<string, unknown> {
    // Add model-specific search fields after generation.
    return {};
  }
}
