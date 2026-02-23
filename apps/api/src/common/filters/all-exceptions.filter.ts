import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx      = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request  = ctx.getRequest<Request>();

    const message =
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : exception instanceof Error
          ? exception.message
          : String(exception);

    this.logger.error(`Unhandled: ${request.method} ${request.url}`, exception);

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message,
      error: "Internal Server Error",
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
