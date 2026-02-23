import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Request } from "express";
import { ProductCategoriesService } from "./product-categories.service";
import { CreateProductCategoryDto } from "./dto/create-product-category.dto";
import { UpdateProductCategoryDto } from "./dto/update-product-category.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { TenantContextGuard } from "../../auth/guards/tenant-context.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { AuditAction } from "../../common/decorators/audit-action.decorator";

@ApiTags("tenant/product-categories")
@ApiBearerAuth()
@Controller("tenant/product-categories")
@UseGuards(JwtAuthGuard, RolesGuard, TenantContextGuard)
@Roles("TENANT_ADMIN", "TENANT_USER")
export class ProductCategoriesController {
  constructor(private service: ProductCategoriesService) {}

  @ApiOperation({ summary: "List all product categories" })
  @Get()
  findAll(@Req() req: Request) {
    return this.service.findAll((req as any).tenantPrisma);
  }

  @ApiOperation({ summary: "Create a product category" })
  @AuditAction("CREATE", "product-category")
  @Post()
  create(@Req() req: Request, @Body() dto: CreateProductCategoryDto) {
    return this.service.create((req as any).tenantPrisma, dto);
  }

  @ApiOperation({ summary: "Update a product category" })
  @AuditAction("UPDATE", "product-category")
  @Patch(":id")
  update(@Req() req: Request, @Param("id") id: string, @Body() dto: UpdateProductCategoryDto) {
    return this.service.update((req as any).tenantPrisma, id, dto);
  }

  @ApiOperation({ summary: "Delete a product category" })
  @AuditAction("DELETE", "product-category")
  @Delete(":id")
  delete(@Req() req: Request, @Param("id") id: string) {
    return this.service.delete((req as any).tenantPrisma, id);
  }
}
