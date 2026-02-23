import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Request } from "express";
import { OrdersService } from "./orders.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { TenantContextGuard } from "../../auth/guards/tenant-context.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { AuditAction } from "../../common/decorators/audit-action.decorator";

@ApiTags("tenant/orders")
@ApiBearerAuth()
@Controller("tenant/orders")
@UseGuards(JwtAuthGuard, RolesGuard, TenantContextGuard)
@Roles("TENANT_ADMIN", "TENANT_USER")
export class OrdersController {
  constructor(private service: OrdersService) {}

  @ApiOperation({ summary: "List orders (paginated)" })
  @Get()
  findAll(@Req() req: Request, @Query() query: PaginationQueryDto) {
    return this.service.findAll((req as any).tenantPrisma, query);
  }

  @ApiOperation({ summary: "Create a new order" })
  @AuditAction("CREATE", "order")
  @Post()
  create(@Req() req: Request, @Body() dto: CreateOrderDto) {
    return this.service.create((req as any).tenantPrisma, dto);
  }

  @ApiOperation({ summary: "Update order status" })
  @AuditAction("UPDATE_STATUS", "order")
  @Patch(":id/status")
  updateStatus(@Req() req: Request, @Param("id") id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.service.updateStatus((req as any).tenantPrisma, id, dto);
  }
}
