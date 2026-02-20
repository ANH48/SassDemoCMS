import { PrismaClient } from "./generated/tenant-client";

export { PrismaClient as TenantPrismaClient };

export function createTenantClient(databaseUrl: string): PrismaClient {
  return new PrismaClient({
    datasourceUrl: databaseUrl,
  });
}
