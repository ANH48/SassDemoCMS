import { Injectable, NotFoundException } from "@nestjs/common";
import { TenantPrismaClient } from "@repo/database";
import { paginate } from "../../common/utils/paginate";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";

@Injectable()
export class CustomersService {
  async findAll(prisma: TenantPrismaClient, query: PaginationQueryDto) {
    return paginate(prisma.customer, query, {
      searchFields: ["name", "email", "phone"],
    });
  }

  async create(prisma: TenantPrismaClient, dto: CreateCustomerDto) {
    return prisma.customer.create({ data: dto });
  }

  async update(prisma: TenantPrismaClient, id: string, dto: UpdateCustomerDto) {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException("Customer not found");
    return prisma.customer.update({ where: { id }, data: dto });
  }
}
