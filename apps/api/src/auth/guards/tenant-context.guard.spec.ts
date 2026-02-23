import { TenantContextGuard } from "./tenant-context.guard";
import { ForbiddenException } from "@nestjs/common";

const mockGlobalPrisma = { tenant: { findUnique: jest.fn() } };
const mockManager = { getClient: jest.fn() };

function makeCtx(user: any) {
  const req: any = { user };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    _req: req,
  } as any;
}

describe("TenantContextGuard", () => {
  let guard: TenantContextGuard;

  beforeEach(() => {
    guard = new TenantContextGuard(mockGlobalPrisma as any, mockManager as any);
    jest.clearAllMocks();
  });

  it("passes through for non-tenant tokens", async () => {
    const ctx = makeCtx({ type: "global" });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it("throws when tenantId missing", async () => {
    const ctx = makeCtx({ type: "tenant", tenantId: undefined });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it("throws when tenant not found", async () => {
    mockGlobalPrisma.tenant.findUnique.mockResolvedValue(null);
    const ctx = makeCtx({ type: "tenant", tenantId: "tid" });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it("throws when tenant is SUSPENDED", async () => {
    mockGlobalPrisma.tenant.findUnique.mockResolvedValue({
      id: "tid", status: "SUSPENDED", databaseUrl: "url",
    });
    const ctx = makeCtx({ type: "tenant", tenantId: "tid" });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it("attaches tenantPrisma and returns true for active tenant", async () => {
    const mockClient = {};
    mockGlobalPrisma.tenant.findUnique.mockResolvedValue({
      id: "tid", status: "ACTIVE", databaseUrl: "postgres://...",
    });
    mockManager.getClient.mockResolvedValue(mockClient);

    const ctx = makeCtx({ type: "tenant", tenantId: "tid" });
    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(ctx._req.tenantPrisma).toBe(mockClient);
  });
});
