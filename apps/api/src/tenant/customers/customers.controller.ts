import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Request } from "express";
import { CustomersService } from "./customers.service";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { TenantContextGuard } from "../../auth/guards/tenant-context.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { AuditAction } from "../../common/decorators/audit-action.decorator";

@ApiTags("tenant/customers")
@ApiBearerAuth()
@Controller("tenant/customers")
@UseGuards(JwtAuthGuard, RolesGuard, TenantContextGuard)
@Roles("TENANT_ADMIN", "TENANT_USER")
export class CustomersController {
  constructor(private service: CustomersService) {}

  @ApiOperation({ summary: "List customers (paginated, searchable)" })
  @Get()
  findAll(@Req() req: Request, @Query() query: PaginationQueryDto) {
    return this.service.findAll((req as any).tenantPrisma, query);
  }

  @ApiOperation({ summary: "Create a customer" })
  @AuditAction("CREATE", "customer")
  @Post()
  create(@Req() req: Request, @Body() dto: CreateCustomerDto) {
    return this.service.create((req as any).tenantPrisma, dto);
  }

  @ApiOperation({ summary: "Update a customer" })
  @AuditAction("UPDATE", "customer")
  @Patch(":id")
  update(@Req() req: Request, @Param("id") id: string, @Body() dto: UpdateCustomerDto) {
    return this.service.update((req as any).tenantPrisma, id, dto);
  }
}
