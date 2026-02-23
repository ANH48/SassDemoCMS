import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx        = host.switchToHttp();
    const response   = ctx.getResponse<Response>();
    const request    = ctx.getRequest<Request>();
    const statusCode = exception.getStatus();
    const exRes      = exception.getResponse();

    const message =
      typeof exRes === "object" && "message" in exRes
        ? (exRes as any).message
        : exception.message;

    const error =
      typeof exRes === "object" && "error" in exRes
        ? (exRes as any).error
        : HttpStatus[statusCode];

    this.logger.warn(`${request.method} ${request.url} → ${statusCode}`);

    response.status(statusCode).json({
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
