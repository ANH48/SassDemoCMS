import { Injectable, Logger } from "@nestjs/common";
import { execSync } from "child_process";
import * as path from "path";
import * as bcrypt from "bcrypt";
import { GlobalPrismaService } from "../database/global-prisma.service";

@Injectable()
export class TenantProvisionerService {
  private readonly logger = new Logger(TenantProvisionerService.name);

  constructor(private globalPrisma: GlobalPrismaService) {}

  async provision(
    tenantId: string,
    slug: string,
    adminEmail: string,
    adminPassword: string,
    adminName: string,
  ): Promise<void> {
    const dbName = `saas_tenant_${slug.replace(/-/g, "_")}`;
    const baseUrl = process.env.DATABASE_URL || "";
    const tenantDbUrl = baseUrl.replace(/\/[^/]+$/, `/${dbName}`);

    try {
      await this.globalPrisma.$executeRawUnsafe(
        `CREATE DATABASE "${dbName}"`,
      );
      this.logger.log(`Created database: ${dbName}`);
    } catch (error: any) {
      if (error.message?.includes("already exists")) {
        this.logger.warn(`Database ${dbName} already exists, continuing...`);
      } else {
        await this.globalPrisma.tenant.update({
          where: { id: tenantId },
          data: { status: "FAILED" },
        });
        throw error;
      }
    }

    try {
      await this.globalPrisma.tenant.update({
        where: { id: tenantId },
        data: { status: "PROVISIONING" },
      });

      const schemaPath = path.resolve(
        __dirname,
        "../../../../packages/database/prisma/tenant/schema.prisma",
      );

      execSync(
        `npx prisma migrate deploy --schema="${schemaPath}"`,
        {
          env: { ...process.env, DATABASE_URL: tenantDbUrl },
          stdio: "pipe",
          timeout: 30000,
        },
      );
      this.logger.log(`Migrations applied to ${dbName}`);

      const { PrismaClient } = await import(
        "@repo/database/src/generated/tenant-client"
      );
      const tenantClient = new PrismaClient({
        datasourceUrl: tenantDbUrl,
      });

      try {
        await tenantClient.$connect();
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        await tenantClient.tenantUser.create({
          data: {
            email: adminEmail,
            password: hashedPassword,
            name: adminName,
            role: "TENANT_ADMIN",
          },
        });
        this.logger.log(`Seeded admin user for ${dbName}`);
      } finally {
        await tenantClient.$disconnect();
      }

      await this.globalPrisma.tenant.update({
        where: { id: tenantId },
        data: {
          status: "ACTIVE",
          databaseUrl: tenantDbUrl,
        },
      });

      this.logger.log(`Tenant ${slug} provisioned successfully`);
    } catch (error) {
      this.logger.error(`Provisioning failed for ${slug}`, error);

      await this.globalPrisma.tenant.update({
        where: { id: tenantId },
        data: { status: "FAILED" },
      });

      try {
        await this.globalPrisma.$executeRawUnsafe(
          `DROP DATABASE IF EXISTS "${dbName}"`,
        );
      } catch (dropError) {
        this.logger.error(`Failed to drop database ${dbName}`, dropError);
      }

      throw error;
    }
  }
}
