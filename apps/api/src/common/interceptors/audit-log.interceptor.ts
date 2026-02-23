import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, tap } from "rxjs";
import { AUDIT_ACTION_KEY, AuditActionMeta } from "../decorators/audit-action.decorator";
import { GlobalPrismaService } from "../../database/global-prisma.service";

const MUTATION_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(
    private reflector: Reflector,
    private globalPrisma: GlobalPrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const meta = this.reflector.getAllAndOverride<AuditActionMeta>(AUDIT_ACTION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();

    if (!meta || !MUTATION_METHODS.has(request.method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        const userId = request.user?.sub ?? "unknown";
        this.globalPrisma.auditLog
          .create({
            data: {
              userId,
              action:   meta.action,
              resource: meta.resource,
              details:  JSON.stringify({ method: request.method, url: request.url }),
            },
          })
          .catch((err) => this.logger.error("Audit log write failed", err));
      }),
    );
  }
}
