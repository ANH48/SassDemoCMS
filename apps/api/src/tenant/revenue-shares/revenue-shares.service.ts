import { Injectable, NotFoundException } from "@nestjs/common";
import { TenantPrismaClient } from "@repo/database";
import { CreateRevenueShareDto } from "./dto/create-revenue-share.dto";
import { UpdateRevenueShareDto } from "./dto/update-revenue-share.dto";

@Injectable()
export class RevenueSharesService {
  async findAll(prisma: TenantPrismaClient) {
    return prisma.revenueShare.findMany({ orderBy: { createdAt: "desc" } });
  }

  async create(prisma: TenantPrismaClient, dto: CreateRevenueShareDto) {
    return prisma.revenueShare.create({ data: dto });
  }

  async update(prisma: TenantPrismaClient, id: string, dto: UpdateRevenueShareDto) {
    const record = await prisma.revenueShare.findUnique({ where: { id } });
    if (!record) throw new NotFoundException("Revenue share not found");
    return prisma.revenueShare.update({ where: { id }, data: dto });
  }
}
