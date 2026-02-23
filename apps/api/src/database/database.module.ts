import { Global, Module } from "@nestjs/common";
import { GlobalPrismaService } from "./global-prisma.service";
import { TenantPrismaManager } from "@repo/database";

const tenantPrismaManagerProvider = {
  provide: TenantPrismaManager,
  useFactory: () => new TenantPrismaManager(),
};

@Global()
@Module({
  providers: [GlobalPrismaService, tenantPrismaManagerProvider],
  exports: [GlobalPrismaService, TenantPrismaManager],
})
export class DatabaseModule {}
