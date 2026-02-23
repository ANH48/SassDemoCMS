import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { TenantPrismaClient } from "@repo/database";
import { paginate } from "../../common/utils/paginate";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { QueryProductDto } from "./dto/query-product.dto";
import { AddPackageItemDto } from "./dto/manage-package-items.dto";

@Injectable()
export class ProductsService {
  async findAll(prisma: TenantPrismaClient, query: QueryProductDto) {
    const where: any = {};
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.productType) where.productType = query.productType;
    if (query.status) where.status = query.status;

    return paginate(prisma.product, query, {
      searchFields: ["name", "sku"],
      where,
      include: { category: true },
    });
  }

  async findOne(prisma: TenantPrismaClient, id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        packageItems: { include: { childProduct: true } },
      },
    });
    if (!product) throw new NotFoundException("Product not found");
    return product;
  }

  async create(prisma: TenantPrismaClient, dto: CreateProductDto) {
    return prisma.product.create({ data: dto as any });
  }

  async update(prisma: TenantPrismaClient, id: string, dto: UpdateProductDto) {
    await this.findOne(prisma, id);
    return prisma.product.update({ where: { id }, data: dto as any });
  }

  async softDelete(prisma: TenantPrismaClient, id: string) {
    await this.findOne(prisma, id);
    return prisma.product.update({ where: { id }, data: { status: "INACTIVE" } });
  }

  async getPackageItems(prisma: TenantPrismaClient, id: string) {
    const product = await this.findOne(prisma, id);
    if (product.productType !== "SERVICE_PACKAGE") {
      throw new BadRequestException("Package items are only for SERVICE_PACKAGE products");
    }
    return prisma.packageItem.findMany({
      where: { parentProductId: id },
      include: { childProduct: true },
    });
  }

  async addPackageItem(prisma: TenantPrismaClient, id: string, dto: AddPackageItemDto) {
    const product = await this.findOne(prisma, id);
    if (product.productType !== "SERVICE_PACKAGE") {
      throw new BadRequestException("Package items are only for SERVICE_PACKAGE products");
    }
    if (dto.childProductId === id) {
      throw new BadRequestException("A product cannot be its own package item");
    }
    return prisma.packageItem.create({
      data: { parentProductId: id, childProductId: dto.childProductId, quantity: dto.quantity },
      include: { childProduct: true },
    });
  }

  async removePackageItem(prisma: TenantPrismaClient, id: string, itemId: string) {
    const item = await prisma.packageItem.findFirst({
      where: { id: itemId, parentProductId: id },
    });
    if (!item) throw new NotFoundException("Package item not found");
    return prisma.packageItem.delete({ where: { id: itemId } });
  }
}
