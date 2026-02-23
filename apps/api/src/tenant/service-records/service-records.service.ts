import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { TenantPrismaClient } from "@repo/database";
import { paginate } from "../../common/utils/paginate";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { CreateServiceRecordDto } from "./dto/create-service-record.dto";

@Injectable()
export class ServiceRecordsService {
  async findAll(prisma: TenantPrismaClient, query: PaginationQueryDto) {
    return paginate(prisma.serviceRecord, query, {
      include: { product: true, customer: true, staff: true },
    });
  }

  async create(prisma: TenantPrismaClient, dto: CreateServiceRecordDto) {
    const product = await prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException("Product not found");
    if (product.productType !== "SERVICE" && product.productType !== "SERVICE_PACKAGE") {
      throw new BadRequestException("Service records can only be created for SERVICE or SERVICE_PACKAGE products");
    }
    return prisma.serviceRecord.create({
      data: dto,
      include: { product: true, customer: true, staff: true },
    });
  }

  async complete(prisma: TenantPrismaClient, id: string) {
    const record = await prisma.serviceRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException("Service record not found");
    return prisma.serviceRecord.update({
      where: { id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
  }
}
