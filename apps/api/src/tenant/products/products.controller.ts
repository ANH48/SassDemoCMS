import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Request } from "express";
import { ProductsService } from "./products.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { QueryProductDto } from "./dto/query-product.dto";
import { AddPackageItemDto } from "./dto/manage-package-items.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { TenantContextGuard } from "../../auth/guards/tenant-context.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { AuditAction } from "../../common/decorators/audit-action.decorator";

@ApiTags("tenant/products")
@ApiBearerAuth()
@Controller("tenant/products")
@UseGuards(JwtAuthGuard, RolesGuard, TenantContextGuard)
@Roles("TENANT_ADMIN", "TENANT_USER")
export class ProductsController {
  constructor(private service: ProductsService) {}

  @ApiOperation({ summary: "List products (paginated, filterable)" })
  @Get()
  findAll(@Req() req: Request, @Query() query: QueryProductDto) {
    return this.service.findAll((req as any).tenantPrisma, query);
  }

  @ApiOperation({ summary: "Get product by ID" })
  @Get(":id")
  findOne(@Req() req: Request, @Param("id") id: string) {
    return this.service.findOne((req as any).tenantPrisma, id);
  }

  @ApiOperation({ summary: "Create a product" })
  @AuditAction("CREATE", "product")
  @Post()
  create(@Req() req: Request, @Body() dto: CreateProductDto) {
    return this.service.create((req as any).tenantPrisma, dto);
  }

  @ApiOperation({ summary: "Update a product" })
  @AuditAction("UPDATE", "product")
  @Patch(":id")
  update(@Req() req: Request, @Param("id") id: string, @Body() dto: UpdateProductDto) {
    return this.service.update((req as any).tenantPrisma, id, dto);
  }

  @ApiOperation({ summary: "Soft-delete a product (sets status to INACTIVE)" })
  @AuditAction("DELETE", "product")
  @Delete(":id")
  softDelete(@Req() req: Request, @Param("id") id: string) {
    return this.service.softDelete((req as any).tenantPrisma, id);
  }

  @ApiOperation({ summary: "Get package items for a SERVICE_PACKAGE product" })
  @Get(":id/package-items")
  getPackageItems(@Req() req: Request, @Param("id") id: string) {
    return this.service.getPackageItems((req as any).tenantPrisma, id);
  }

  @ApiOperation({ summary: "Add a package item to a SERVICE_PACKAGE product" })
  @AuditAction("CREATE", "package-item")
  @Post(":id/package-items")
  addPackageItem(@Req() req: Request, @Param("id") id: string, @Body() dto: AddPackageItemDto) {
    return this.service.addPackageItem((req as any).tenantPrisma, id, dto);
  }

  @ApiOperation({ summary: "Remove a package item from a SERVICE_PACKAGE product" })
  @AuditAction("DELETE", "package-item")
  @Delete(":id/package-items/:itemId")
  removePackageItem(@Req() req: Request, @Param("id") id: string, @Param("itemId") itemId: string) {
    return this.service.removePackageItem((req as any).tenantPrisma, id, itemId);
  }
}
