import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

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
    const status: HttpStatus = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = isHttpException
      ? exception.getResponse()
      : undefined;
    const nodeEnv = this.config.get<string>('nodeEnv', 'development');

    const body: ErrorResponseBody = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      method: request.method,
      path: request.originalUrl ?? request.url,
      requestId: request.requestId,
      error: this.extractError(exceptionResponse, status),
      message: this.extractMessage(exception, exceptionResponse, status),
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
