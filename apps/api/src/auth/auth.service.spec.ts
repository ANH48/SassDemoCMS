import { Test, TestingModule } from "@nestjs/testing";
import { UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { AuthService } from "./auth.service";
import { GlobalPrismaService } from "../database/global-prisma.service";
import { TenantPrismaManager } from "@repo/database";

const mockGlobalPrisma = {
  globalUser: { findUnique: jest.fn() },
  tenant:     { findUnique: jest.fn() },
};

const mockTenantPrismaManager = {
  getClient: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue("signed-token"),
};

describe("AuthService", () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: GlobalPrismaService,   useValue: mockGlobalPrisma },
        { provide: TenantPrismaManager,   useValue: mockTenantPrismaManager },
        { provide: JwtService,            useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe("globalLogin", () => {
    it("throws UnauthorizedException when user not found", async () => {
      mockGlobalPrisma.globalUser.findUnique.mockResolvedValue(null);
      await expect(service.globalLogin({ email: "x@x.com", password: "pw" }))
        .rejects.toThrow(UnauthorizedException);
    });

    it("throws UnauthorizedException on wrong password", async () => {
      const hashed = await bcrypt.hash("correct", 10);
      mockGlobalPrisma.globalUser.findUnique.mockResolvedValue({
        id: "uid", email: "x@x.com", password: hashed, role: "GLOBAL_ADMIN",
      });
      await expect(service.globalLogin({ email: "x@x.com", password: "wrong" }))
        .rejects.toThrow(UnauthorizedException);
    });

    it("returns accessToken on valid credentials", async () => {
      const hashed = await bcrypt.hash("correct", 10);
      mockGlobalPrisma.globalUser.findUnique.mockResolvedValue({
        id: "uid", email: "x@x.com", password: hashed, role: "GLOBAL_ADMIN",
      });
      const result = await service.globalLogin({ email: "x@x.com", password: "correct" });
      expect(result).toHaveProperty("accessToken", "signed-token");
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ type: "global", role: "GLOBAL_ADMIN" }),
      );
    });
  });

  describe("tenantLogin", () => {
    it("throws when tenant not found", async () => {
      mockGlobalPrisma.tenant.findUnique.mockResolvedValue(null);
      await expect(service.tenantLogin({ email: "a@b.com", password: "pw", tenantSlug: "slug" }))
        .rejects.toThrow(UnauthorizedException);
    });

    it("throws when tenant is not ACTIVE", async () => {
      mockGlobalPrisma.tenant.findUnique.mockResolvedValue({
        id: "tid", slug: "slug", status: "PROVISIONING", databaseUrl: "url",
      });
      await expect(service.tenantLogin({ email: "a@b.com", password: "pw", tenantSlug: "slug" }))
        .rejects.toThrow(UnauthorizedException);
    });

    it("returns accessToken on valid tenant login", async () => {
      const hashed = await bcrypt.hash("pass", 10);
      mockGlobalPrisma.tenant.findUnique.mockResolvedValue({
        id: "tid", slug: "slug", status: "ACTIVE", databaseUrl: "postgres://...",
      });
      const mockTenantClient = {
        tenantUser: { findUnique: jest.fn().mockResolvedValue({
          id: "uid", email: "a@b.com", password: hashed, role: "TENANT_ADMIN",
        }) },
      };
      mockTenantPrismaManager.getClient.mockResolvedValue(mockTenantClient);

      const result = await service.tenantLogin({ email: "a@b.com", password: "pass", tenantSlug: "slug" });
      expect(result).toHaveProperty("accessToken", "signed-token");
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ type: "tenant", tenantId: "tid" }),
      );
    });
  });
});
