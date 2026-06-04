import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  pageSize!: number;

  @ApiProperty({ example: 143 })
  total!: number;

  @ApiProperty({ example: 8 })
  totalPages!: number;
}

/**
 * Generic success envelope. Documented for OpenAPI via the
 * `ApiOkResponseData` / `ApiCreatedResponseData` helpers, which override the
 * `data` property with the concrete model. Produced at runtime by
 * `TransformInterceptor`.
 */
export class ApiResponseDto<T> {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiHideProperty()
  data!: T;

  @ApiPropertyOptional({ type: PaginationMetaDto })
  meta?: PaginationMetaDto;

  @ApiProperty({ example: '2026-06-03T10:00:00.000Z' })
  timestamp!: string;

  @ApiPropertyOptional({ example: 'b2c1e0f4-9a3d-4c8e-bf2a-1d6c5e4f7a90' })
  requestId?: string;
}
