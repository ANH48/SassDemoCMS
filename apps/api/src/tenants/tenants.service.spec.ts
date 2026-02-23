import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, ConflictException } from "@nestjs/common";
import { TenantsService } from "./tenants.service";
import { GlobalPrismaService } from "../database/global-prisma.service";
import { TenantProvisionerService } from "./tenant-provisioner.service";

const mockPrisma = {
  tenant: {
    findUnique: jest.fn(),
    findMany:   jest.fn(),
    count:      jest.fn(),
    create:     jest.fn(),
    update:     jest.fn(),
  },
  subscription: { create: jest.fn() },
};

const mockProvisioner = { provision: jest.fn() };

const baseTenant = {
  id: "t1", name: "Test", slug: "test", status: "ACTIVE",
  databaseUrl: "postgres://...", subscriptions: [], features: [],
};

describe("TenantsService", () => {
  let service: TenantsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        { provide: GlobalPrismaService,     useValue: mockPrisma },
        { provide: TenantProvisionerService, useValue: mockProvisioner },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
    jest.clearAllMocks();
  });

  describe("findAll", () => {
    it("returns paginated data", async () => {
      mockPrisma.tenant.findMany.mockResolvedValue([baseTenant]);
      mockPrisma.tenant.count.mockResolvedValue(1);
      const result = await service.findAll(1, 10);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe("findOne", () => {
    it("throws NotFoundException for unknown tenant", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null);
      await expect(service.findOne("bad-id")).rejects.toThrow(NotFoundException);
    });

    it("returns tenant when found", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(baseTenant);
      const result = await service.findOne("t1");
      expect(result.id).toBe("t1");
    });
  });

  describe("create", () => {
    it("throws ConflictException when slug exists", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(baseTenant);
      await expect(service.create({
        name: "X", slug: "test", adminEmail: "a@b.com",
        adminPassword: "pass", adminName: "A",
      })).rejects.toThrow(ConflictException);
    });

    it("creates tenant and calls provisioner", async () => {
      mockPrisma.tenant.findUnique
        .mockResolvedValueOnce(null)    // slug check
        .mockResolvedValueOnce(baseTenant); // findOne after create
      mockPrisma.tenant.create.mockResolvedValue({ id: "t1", slug: "new" });
      mockProvisioner.provision.mockResolvedValue(undefined);

      const result = await service.create({
        name: "New", slug: "new", adminEmail: "a@b.com",
        adminPassword: "pass", adminName: "Admin",
      });

      expect(mockProvisioner.provision).toHaveBeenCalledWith("t1", "new", "a@b.com", "pass", "Admin");
      expect(result.id).toBe("t1");
    });
  });

  describe("suspend", () => {
    it("sets tenant status to SUSPENDED", async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(baseTenant);
      mockPrisma.tenant.update.mockResolvedValue({ ...baseTenant, status: "SUSPENDED" });
      const result = await service.suspend("t1");
      expect(mockPrisma.tenant.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: "SUSPENDED" } }),
      );
      expect(result.status).toBe("SUSPENDED");
    });
  });
});
