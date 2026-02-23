import { Injectable, NotFoundException } from "@nestjs/common";
import { GlobalPrismaService } from "../database/global-prisma.service";
import { CreateSubscriptionDto } from "./dto/create-subscription.dto";
import { UpdateSubscriptionDto, SetRentalFeeDto } from "./dto/update-subscription.dto";

@Injectable()
export class SubscriptionsService {
  constructor(private globalPrisma: GlobalPrismaService) {}

  async create(dto: CreateSubscriptionDto) {
    return this.globalPrisma.subscription.create({
      data: {
        tenantId: dto.tenantId,
        planId: dto.planId,
      },
      include: { plan: true, tenant: true },
    });
  }

  async update(id: string, dto: UpdateSubscriptionDto) {
    const sub = await this.globalPrisma.subscription.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException("Subscription not found");

    return this.globalPrisma.subscription.update({
      where: { id },
      data: dto,
      include: { plan: true },
    });
  }

  async setRentalFee(id: string, dto: SetRentalFeeDto) {
    const sub = await this.globalPrisma.subscription.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException("Subscription not found");

    return this.globalPrisma.subscription.update({
      where: { id },
      data: { rentalFee: dto.rentalFee },
      include: { plan: true },
    });
  }
}
