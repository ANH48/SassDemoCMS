import { Controller, Get, Post, Patch, Body, Param, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Request } from "express";
import { RevenueSharesService } from "./revenue-shares.service";
import { CreateRevenueShareDto } from "./dto/create-revenue-share.dto";
import { UpdateRevenueShareDto } from "./dto/update-revenue-share.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { TenantContextGuard } from "../../auth/guards/tenant-context.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { AuditAction } from "../../common/decorators/audit-action.decorator";

@ApiTags("tenant/revenue-shares")
@ApiBearerAuth()
@Controller("tenant/revenue-shares")
@UseGuards(JwtAuthGuard, RolesGuard, TenantContextGuard)
@Roles("TENANT_ADMIN")
export class RevenueSharesController {
  constructor(private service: RevenueSharesService) {}

  @ApiOperation({ summary: "List revenue share configurations" })
  @Get()
  findAll(@Req() req: Request) {
    return this.service.findAll((req as any).tenantPrisma);
  }

  @ApiOperation({ summary: "Create a revenue share configuration" })
  @AuditAction("CREATE", "revenue-share")
  @Post()
  create(@Req() req: Request, @Body() dto: CreateRevenueShareDto) {
    return this.service.create((req as any).tenantPrisma, dto);
  }

  @ApiOperation({ summary: "Update a revenue share configuration" })
  @AuditAction("UPDATE", "revenue-share")
  @Patch(":id")
  update(@Req() req: Request, @Param("id") id: string, @Body() dto: UpdateRevenueShareDto) {
    return this.service.update((req as any).tenantPrisma, id, dto);
  }
}
