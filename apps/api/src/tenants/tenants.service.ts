import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { GlobalPrismaService } from "../database/global-prisma.service";
import { TenantProvisionerService } from "./tenant-provisioner.service";
import { CreateTenantDto } from "./dto/create-tenant.dto";
import { UpdateTenantDto } from "./dto/update-tenant.dto";

@Injectable()
export class TenantsService {
  constructor(
    private globalPrisma: GlobalPrismaService,
    private provisioner: TenantProvisionerService,
  ) {}

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.globalPrisma.tenant.findMany({
        skip,
        take: limit,
        include: { subscriptions: { include: { plan: true } } },
        orderBy: { createdAt: "desc" },
      }),
      this.globalPrisma.tenant.count(),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const tenant = await this.globalPrisma.tenant.findUnique({
      where: { id },
      include: {
        subscriptions: { include: { plan: true } },
        features: { include: { feature: true } },
      },
    });

    if (!tenant) {
      throw new NotFoundException("Tenant not found");
    }

    return tenant;
  }

  async create(dto: CreateTenantDto) {
    const existing = await this.globalPrisma.tenant.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException("Tenant slug already exists");
    }

    const tenant = await this.globalPrisma.tenant.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        status: "QUEUED",
      },
    });

    if (dto.planId) {
      await this.globalPrisma.subscription.create({
        data: {
          tenantId: tenant.id,
          planId: dto.planId,
        },
      });
    }

    await this.provisioner.provision(
      tenant.id,
      tenant.slug,
      dto.adminEmail,
      dto.adminPassword,
      dto.adminName,
    );

    return this.findOne(tenant.id);
  }

  async update(id: string, dto: UpdateTenantDto) {
    await this.findOne(id);

    return this.globalPrisma.tenant.update({
      where: { id },
      data: dto,
    });
  }

  async suspend(id: string) {
    await this.findOne(id);

    return this.globalPrisma.tenant.update({
      where: { id },
      data: { status: "SUSPENDED" },
    });
  }
}
