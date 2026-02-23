import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Request } from "express";
import { ServiceRecordsService } from "./service-records.service";
import { CreateServiceRecordDto } from "./dto/create-service-record.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { TenantContextGuard } from "../../auth/guards/tenant-context.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { AuditAction } from "../../common/decorators/audit-action.decorator";

@ApiTags("tenant/service-records")
@ApiBearerAuth()
@Controller("tenant/service-records")
@UseGuards(JwtAuthGuard, RolesGuard, TenantContextGuard)
@Roles("TENANT_ADMIN", "TENANT_USER")
export class ServiceRecordsController {
  constructor(private service: ServiceRecordsService) {}

  @ApiOperation({ summary: "List service records (paginated)" })
  @Get()
  findAll(@Req() req: Request, @Query() query: PaginationQueryDto) {
    return this.service.findAll((req as any).tenantPrisma, query);
  }

  @ApiOperation({ summary: "Create a service record" })
  @AuditAction("CREATE", "service-record")
  @Post()
  create(@Req() req: Request, @Body() dto: CreateServiceRecordDto) {
    return this.service.create((req as any).tenantPrisma, dto);
  }

  @ApiOperation({ summary: "Mark a service record as completed" })
  @AuditAction("COMPLETE", "service-record")
  @Patch(":id/complete")
  complete(@Req() req: Request, @Param("id") id: string) {
    return this.service.complete((req as any).tenantPrisma, id);
  }
}
