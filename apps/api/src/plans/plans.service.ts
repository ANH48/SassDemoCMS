import { Injectable, NotFoundException } from "@nestjs/common";
import { GlobalPrismaService } from "../database/global-prisma.service";
import { CreatePlanDto } from "./dto/create-plan.dto";

@Injectable()
export class PlansService {
  constructor(private globalPrisma: GlobalPrismaService) {}

  async findAll() {
    return this.globalPrisma.plan.findMany({
      orderBy: { price: "asc" },
    });
  }

  async findOne(id: string) {
    const plan = await this.globalPrisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException("Plan not found");
    return plan;
  }

  async create(dto: CreatePlanDto) {
    return this.globalPrisma.plan.create({
      data: {
        name: dto.name,
        price: dto.price,
        maxProducts: dto.maxProducts,
        maxUsers: dto.maxUsers,
      },
    });
  }
}
