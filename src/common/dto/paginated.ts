import type { PaginationMetaDto } from './api-response.dto';

/**
 * Marker wrapper returned by services/controllers that paginate. The global
 * `TransformInterceptor` detects it and lifts `meta` into the response
 * envelope alongside `data`.
 */
export class Paginated<T> {
  readonly data: T[];
  readonly meta: PaginationMetaDto;

  constructor(data: T[], meta: PaginationMetaDto) {
    this.data = data;
    this.meta = meta;
  }
}

export function paginate<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number,
): Paginated<T> {
  return new Paginated(data, {
    page,
    pageSize,
    total,
    totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
  });
}
