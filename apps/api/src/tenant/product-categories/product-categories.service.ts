import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { TenantPrismaClient } from "@repo/database";
import { CreateProductCategoryDto } from "./dto/create-product-category.dto";
import { UpdateProductCategoryDto } from "./dto/update-product-category.dto";

@Injectable()
export class ProductCategoriesService {
  async findAll(prisma: TenantPrismaClient) {
    return prisma.productCategory.findMany({ orderBy: { sortOrder: "asc" } });
  }

  async create(prisma: TenantPrismaClient, dto: CreateProductCategoryDto) {
    return prisma.productCategory.create({ data: dto });
  }

  async update(prisma: TenantPrismaClient, id: string, dto: UpdateProductCategoryDto) {
    await this.findOrFail(prisma, id);
    return prisma.productCategory.update({ where: { id }, data: dto });
  }

  async delete(prisma: TenantPrismaClient, id: string) {
    await this.findOrFail(prisma, id);
    const count = await prisma.product.count({ where: { categoryId: id } });
    if (count > 0) {
      throw new BadRequestException("Cannot delete category with assigned products");
    }
    return prisma.productCategory.delete({ where: { id } });
  }

  private async findOrFail(prisma: TenantPrismaClient, id: string) {
    const category = await prisma.productCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException("Product category not found");
    return category;
  }
}
