import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

interface ErrorResponseBody {
  success: false;
  statusCode: number;
  timestamp: string;
  method: string;
  path: string;
  requestId?: string;
  error?: string;
  message: string | string[];
  stack?: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly config: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request & { requestId?: string }>();

    const isHttpException = exception instanceof HttpException;
    let status: HttpStatus = isHttpException
      ? (exception as HttpException).getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = isHttpException
      ? (exception as HttpException).getResponse()
      : undefined;

    let error = this.extractError(exceptionResponse, status);
    let message = this.extractMessage(exception, exceptionResponse, status);

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        let target = 'field';
        if (exception.meta?.target && Array.isArray(exception.meta.target)) {
          target = exception.meta.target.join(', ');
        } else {
          const match = exception.message.match(
            /Unique constraint failed on the fields:\s*\((.*?)\)/s,
          );
          if (match) {
            target = match[1].replace(/["`]/g, '');
          } else if (exception.meta && typeof exception.meta === 'object') {
            const cause = (exception.meta as any).driverAdapterError?.cause;
            if (
              cause?.constraint?.fields &&
              Array.isArray(cause.constraint.fields)
            ) {
              target = cause.constraint.fields
                .map((f: string) => f.replace(/["`]/g, ''))
                .join(', ');
            }
          }
        }
        status = HttpStatus.CONFLICT;
        message = `Unique constraint failed on: ${target}`;
        error = 'Conflict';
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = (exception.meta?.cause as string) ?? 'Record not found';
        error = 'Not Found';
      } else if (exception.code === 'P2003') {
        status = HttpStatus.BAD_REQUEST;
        message = `Foreign key constraint failed on the field: ${exception.meta?.field_name ?? 'field'}`;
        error = 'Bad Request';
      }
    }

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      console.error(
        'Unhandled Exception caught by HttpExceptionFilter:',
        exception,
      );
    }

    const nodeEnv = this.config.get<string>('nodeEnv', 'development');

    const body: ErrorResponseBody = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      method: request.method,
      path: request.originalUrl ?? request.url,
      requestId: request.requestId,
      error,
      message,
    };

    if (nodeEnv !== 'production' && exception instanceof Error) {
      body.stack = exception.stack;
    }

    response.status(status).json(body);
  }

  private extractError(responseBody: unknown, status: HttpStatus): string {
    if (this.isRecord(responseBody) && typeof responseBody.error === 'string') {
      return responseBody.error;
    }
    return HttpStatus[status] ?? 'Error';
  }

  private extractMessage(
    exception: unknown,
    responseBody: unknown,
    status: HttpStatus,
  ): string | string[] {
    if (typeof responseBody === 'string') {
      return responseBody;
    }

    if (this.isRecord(responseBody)) {
      const message = responseBody.message;
      if (typeof message === 'string') {
        return message;
      }
      if (
        Array.isArray(message) &&
        message.every((item) => typeof item === 'string')
      ) {
        return message;
      }
    }

    if (
      exception instanceof Error &&
      status !== HttpStatus.INTERNAL_SERVER_ERROR
    ) {
      return exception.message;
    }

    return status === HttpStatus.INTERNAL_SERVER_ERROR
      ? 'Internal server error'
      : 'Request failed';
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
