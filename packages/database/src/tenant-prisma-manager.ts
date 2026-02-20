import { PrismaClient } from "./generated/tenant-client";

interface CachedClient {
  client: PrismaClient;
  lastUsed: number;
}

export class TenantPrismaManager {
  private clients = new Map<string, CachedClient>();
  private evictionInterval: ReturnType<typeof setInterval> | null = null;

  constructor(private maxIdleMs: number = 600_000) {
    this.evictionInterval = setInterval(
      () => this.evictIdle(),
      this.maxIdleMs / 2,
    );
  }

  async getClient(tenantId: string, databaseUrl: string): Promise<PrismaClient> {
    const cached = this.clients.get(tenantId);

    if (cached) {
      cached.lastUsed = Date.now();
      return cached.client;
    }

    const client = new PrismaClient({
      datasourceUrl: databaseUrl,
    });

    await client.$connect();

    this.clients.set(tenantId, {
      client,
      lastUsed: Date.now(),
    });

    return client;
  }

  async evictIdle(): Promise<void> {
    const now = Date.now();
    const toEvict: string[] = [];

    for (const [tenantId, cached] of this.clients.entries()) {
      if (now - cached.lastUsed > this.maxIdleMs) {
        toEvict.push(tenantId);
      }
    }

    for (const tenantId of toEvict) {
      const cached = this.clients.get(tenantId);
      if (cached) {
        await cached.client.$disconnect();
        this.clients.delete(tenantId);
      }
    }
  }

  async disconnectAll(): Promise<void> {
    if (this.evictionInterval) {
      clearInterval(this.evictionInterval);
      this.evictionInterval = null;
    }

    const entries = Array.from(this.clients.values());
    for (const cached of entries) {
      await cached.client.$disconnect();
    }

    this.clients.clear();
  }

  get size(): number {
    return this.clients.size;
  }
}
