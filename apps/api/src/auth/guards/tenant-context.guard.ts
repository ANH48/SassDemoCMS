import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";
import { GlobalPrismaService } from "../../database/global-prisma.service";
import { TenantPrismaManager } from "@repo/database";
import { JwtPayload } from "@repo/types";

@Injectable()
export class TenantContextGuard implements CanActivate {
  constructor(
    private globalPrisma: GlobalPrismaService,
    private tenantPrismaManager: TenantPrismaManager,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    if (!user || user.type !== "tenant") {
      return true;
    }

    if (!user.tenantId) {
      throw new ForbiddenException("Missing tenant context");
    }

    const tenant = await this.globalPrisma.tenant.findUnique({
      where: { id: user.tenantId },
    });

    if (!tenant) {
      throw new ForbiddenException("Tenant not found");
    }

    if (tenant.status !== "ACTIVE") {
      throw new ForbiddenException("Tenant is not active");
    }

    if (!tenant.databaseUrl) {
      throw new ForbiddenException("Tenant database not configured");
    }

    request.tenantPrisma = await this.tenantPrismaManager.getClient(
      user.tenantId,
      tenant.databaseUrl,
    );

    return true;
  }
}
