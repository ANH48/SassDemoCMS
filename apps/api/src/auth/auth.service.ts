import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { GlobalPrismaService } from "../database/global-prisma.service";
import { TenantPrismaManager } from "@repo/database";
import { JwtPayload } from "@repo/types";
import { GlobalLoginDto } from "./dto/global-login.dto";
import { TenantLoginDto } from "./dto/tenant-login.dto";

@Injectable()
export class AuthService {
  constructor(
    private globalPrisma: GlobalPrismaService,
    private tenantPrismaManager: TenantPrismaManager,
    private jwtService: JwtService,
  ) {}

  async globalLogin(dto: GlobalLoginDto): Promise<{ accessToken: string }> {
    const user = await this.globalPrisma.globalUser.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: "GLOBAL_ADMIN",
      type: "global",
    };

    return { accessToken: this.jwtService.sign(payload) };
  }

  async tenantLogin(dto: TenantLoginDto): Promise<{ accessToken: string }> {
    const tenant = await this.globalPrisma.tenant.findUnique({
      where: { slug: dto.tenantSlug },
    });

    if (!tenant || tenant.status !== "ACTIVE" || !tenant.databaseUrl) {
      throw new UnauthorizedException("Tenant not found or inactive");
    }

    const tenantClient = await this.tenantPrismaManager.getClient(
      tenant.id,
      tenant.databaseUrl,
    );

    const user = await tenantClient.tenantUser.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as "TENANT_ADMIN" | "TENANT_USER",
      type: "tenant",
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
    };

    return { accessToken: this.jwtService.sign(payload) };
  }
}
