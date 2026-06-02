import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Create__Feature__Dto } from './dto/create-__feature__.dto';
import { Update__Feature__Dto } from './dto/update-__feature__.dto';
import { __Feature__ } from './entities/__feature__.entity';

@Injectable()
export class __Feature__Service {
  private readonly items = new Map<string, __Feature__>();

  findAll(): __Feature__[] {
    return [...this.items.values()];
  }

  findOne(id: string): __Feature__ {
    const item = this.items.get(id);
    if (!item) {
      throw new NotFoundException(`__Feature__ ${id} not found`);
    }
    return item;
  }

  create(dto: Create__Feature__Dto): __Feature__ {
    const now = new Date();
    const item = new __Feature__({
      id: randomUUID(),
      name: dto.name,
      createdAt: now,
      updatedAt: now,
    });
    this.items.set(item.id, item);
    return item;
  }

  update(id: string, dto: Update__Feature__Dto): __Feature__ {
    const existing = this.findOne(id);
    const updated = new __Feature__({
      ...existing,
      ...dto,
      updatedAt: new Date(),
    });
    this.items.set(id, updated);
    return updated;
  }
}
