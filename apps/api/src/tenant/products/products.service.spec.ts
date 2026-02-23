import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ProductsService } from "./products.service";

const mockPrisma = {
  product:     { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  packageItem: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn(), delete: jest.fn() },
};

const baseProduct = {
  id: "p1", name: "Test", productType: "GOODS", sellingPrice1: 10,
  status: "ACTIVE", category: null, packageItems: [],
};

describe("ProductsService", () => {
  let service: ProductsService;

  beforeEach(() => {
    service = new ProductsService();
    jest.clearAllMocks();
  });

  describe("findOne", () => {
    it("throws NotFoundException for unknown product", async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);
      await expect(service.findOne(mockPrisma as any, "bad")).rejects.toThrow(NotFoundException);
    });

    it("returns product when found", async () => {
      mockPrisma.product.findUnique.mockResolvedValue(baseProduct);
      const result = await service.findOne(mockPrisma as any, "p1");
      expect(result.id).toBe("p1");
    });
  });

  describe("softDelete", () => {
    it("sets status to INACTIVE", async () => {
      mockPrisma.product.findUnique.mockResolvedValue(baseProduct);
      mockPrisma.product.update.mockResolvedValue({ ...baseProduct, status: "INACTIVE" });
      await service.softDelete(mockPrisma as any, "p1");
      expect(mockPrisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: "INACTIVE" } }),
      );
    });
  });

  describe("addPackageItem", () => {
    it("throws BadRequestException for non SERVICE_PACKAGE type", async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ ...baseProduct, productType: "GOODS" });
      await expect(
        service.addPackageItem(mockPrisma as any, "p1", { childProductId: "p2", quantity: 1 }),
      ).rejects.toThrow(BadRequestException);
    });

    it("throws BadRequestException for circular reference", async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ ...baseProduct, productType: "SERVICE_PACKAGE" });
      await expect(
        service.addPackageItem(mockPrisma as any, "p1", { childProductId: "p1", quantity: 1 }),
      ).rejects.toThrow(BadRequestException);
    });

    it("creates package item for valid SERVICE_PACKAGE", async () => {
      mockPrisma.product.findUnique.mockResolvedValue({ ...baseProduct, productType: "SERVICE_PACKAGE" });
      mockPrisma.packageItem.create.mockResolvedValue({
        id: "pi1", parentProductId: "p1", childProductId: "p2", quantity: 2,
      });
      const result = await service.addPackageItem(mockPrisma as any, "p1", { childProductId: "p2", quantity: 2 });
      expect(mockPrisma.packageItem.create).toHaveBeenCalled();
      expect(result.quantity).toBe(2);
    });
  });
});
