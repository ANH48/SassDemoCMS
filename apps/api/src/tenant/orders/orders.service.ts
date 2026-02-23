import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { TenantPrismaClient } from "@repo/database";
import { paginate } from "../../common/utils/paginate";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto";
import { getProductBehavior } from "../products/product-type-behavior";

@Injectable()
export class OrdersService {
  async findAll(prisma: TenantPrismaClient, query: PaginationQueryDto) {
    return paginate(prisma.order, query, {
      include: { customer: true, items: { include: { product: true } } },
    });
  }

  async create(prisma: TenantPrismaClient, dto: CreateOrderDto) {
    return prisma.$transaction(async (tx) => {
      let total = 0;

      for (const item of dto.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) {
          throw new NotFoundException(`Product ${item.productId} not found`);
        }

        if (item.priceTier) {
          const tierField = `sellingPrice${item.priceTier}` as keyof typeof product;
          if (!product[tierField]) {
            throw new BadRequestException(
              `Price tier ${item.priceTier} is not set for product ${product.name}`,
            );
          }
        }

        const behavior = getProductBehavior(product.productType);
        if (behavior.hasInventory) {
          if (product.stock < item.quantity) {
            throw new BadRequestException(
              `Insufficient stock for product ${product.name}`,
            );
          }
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }

        const lineTotal = item.unitPrice * item.quantity - (item.discount ?? 0);
        total += lineTotal;
      }

      const order = await tx.order.create({
        data: {
          customerId: dto.customerId,
          total,
          items: {
            create: dto.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              priceTier: item.priceTier,
              discount: item.discount ?? 0,
              staffId: item.staffId,
            })),
          },
        },
        include: { customer: true, items: true },
      });

      return order;
    });
  }

  async updateStatus(prisma: TenantPrismaClient, id: string, dto: UpdateOrderStatusDto) {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException("Order not found");
    return prisma.order.update({ where: { id }, data: { status: dto.status } });
  }
}
