import { Injectable, NotFoundException } from "@nestjs/common";
import { GlobalPrismaService } from "../database/global-prisma.service";
import { CreateFeatureDto } from "./dto/create-feature.dto";
import { ToggleFeatureDto } from "./dto/toggle-feature.dto";

@Injectable()
export class FeaturesService {
  constructor(private globalPrisma: GlobalPrismaService) {}

  async findAll() {
    return this.globalPrisma.feature.findMany({
      orderBy: { name: "asc" },
    });
  }

  async create(dto: CreateFeatureDto) {
    return this.globalPrisma.feature.create({
      data: {
        name: dto.name,
        description: dto.description,
      },
    });
  }

  async toggleForTenant(tenantId: string, dto: ToggleFeatureDto) {
    const tenant = await this.globalPrisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) throw new NotFoundException("Tenant not found");

    const feature = await this.globalPrisma.feature.findUnique({
      where: { id: dto.featureId },
    });
    if (!feature) throw new NotFoundException("Feature not found");

    return this.globalPrisma.tenantFeature.upsert({
      where: {
        tenantId_featureId: {
          tenantId,
          featureId: dto.featureId,
        },
      },
      update: { enabled: dto.enabled },
      create: {
        tenantId,
        featureId: dto.featureId,
        enabled: dto.enabled,
      },
      include: { feature: true },
    });
  }
}
