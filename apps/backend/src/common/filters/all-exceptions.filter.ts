import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const isProduction = process.env.NODE_ENV === 'production';

    let message = 'An unexpected server error occurred. Please try again later.';
    let errorDetails: any = undefined;

    if (exception instanceof HttpException) {
      const resResponse = exception.getResponse();
      if (typeof resResponse === 'string') {
        message = resResponse;
      } else if (typeof resResponse === 'object' && resResponse !== null) {
        message = (resResponse as any).message || exception.message;
        errorDetails = (resResponse as any).errors || (resResponse as any).error;
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled Exception on ${request.method} ${request.url}: ${exception.message}`,
        exception.stack,
      );
      if (!isProduction) {
        message = exception.message;
      }
    }

    // Do not leak internal stack traces or database info in production responses
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: Array.isArray(message) ? message[0] : message,
      ...(errorDetails && { details: errorDetails }),
    });
  }
}
