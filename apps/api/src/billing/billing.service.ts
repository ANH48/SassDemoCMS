import { Injectable } from "@nestjs/common";
import { GlobalPrismaService } from "../database/global-prisma.service";

@Injectable()
export class BillingService {
  constructor(private globalPrisma: GlobalPrismaService) {}

  async getOverview() {
    const [records, totalTenants, activeSubscriptions] = await Promise.all([
      this.globalPrisma.billingRecord.findMany({
        include: { tenant: { select: { name: true, slug: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      this.globalPrisma.tenant.count({ where: { status: "ACTIVE" } }),
      this.globalPrisma.subscription.count({ where: { status: "ACTIVE" } }),
    ]);

    return {
      totalActiveTenants: totalTenants,
      activeSubscriptions,
      recentRecords: records,
    };
  }
}
