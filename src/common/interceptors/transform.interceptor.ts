import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { PaginationMetaDto } from '@/common/dto/api-response.dto';
import { Paginated } from '@/common/dto/paginated';

export interface ApiResponseBody {
  success: true;
  data: unknown;
  meta?: PaginationMetaDto;
  timestamp: string;
  requestId?: string;
}

/**
 * Wraps every successful controller return value in the standard response
 * envelope so success responses are symmetric with `HttpExceptionFilter`
 * errors. Controllers return DTOs (or a `Paginated<T>`) as usual — no
 * per-handler changes required.
 */
@Injectable()
export class TransformInterceptor implements NestInterceptor<
  unknown,
  ApiResponseBody
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<ApiResponseBody> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { requestId?: string }>();

    return next.handle().pipe(
      map((payload): ApiResponseBody => {
        const timestamp = new Date().toISOString();
        const requestId = request.requestId;

        if (payload instanceof Paginated) {
          return {
            success: true,
            data: payload.data,
            meta: payload.meta,
            timestamp,
            requestId,
          };
        }

        return {
          success: true,
          data: payload,
          timestamp,
          requestId,
        };
      }),
    );
  }
}
