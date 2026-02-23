import { BadRequestException, NotFoundException } from "@nestjs/common";
import { OrdersService } from "./orders.service";

const mockPrisma = {
  order: { findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  $transaction: jest.fn(),
};

const baseOrder = {
  id: "o1", customerId: "c1", total: 100, status: "PENDING", items: [],
};

describe("OrdersService", () => {
  let service: OrdersService;

  beforeEach(() => {
    service = new OrdersService();
    jest.clearAllMocks();
  });

  describe("updateStatus", () => {
    it("throws NotFoundException for unknown order", async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);
      await expect(
        service.updateStatus(mockPrisma as any, "bad", { status: "COMPLETED" as any }),
      ).rejects.toThrow(NotFoundException);
    });

    it("updates order status", async () => {
      mockPrisma.order.findUnique.mockResolvedValue(baseOrder);
      mockPrisma.order.update.mockResolvedValue({ ...baseOrder, status: "COMPLETED" });
      const result = await service.updateStatus(mockPrisma as any, "o1", { status: "COMPLETED" as any });
      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: "COMPLETED" } }),
      );
      expect(result.status).toBe("COMPLETED");
    });
  });

  describe("create", () => {
    it("wraps creation in a transaction", async () => {
      mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));
      const tx = mockPrisma as any;
      tx.product = { findUnique: jest.fn().mockResolvedValue({
        id: "p1", name: "Prod", productType: "SERVICE", sellingPrice1: 50, stock: 0,
      })};
      tx.order = { create: jest.fn().mockResolvedValue(baseOrder) };
      tx.product.update = jest.fn();

      await service.create(mockPrisma as any, {
        customerId: "c1",
        items: [{ productId: "p1", quantity: 1, unitPrice: 50 }],
      });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("throws BadRequestException for invalid price tier", async () => {
      mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));
      const tx = mockPrisma as any;
      tx.product = { findUnique: jest.fn().mockResolvedValue({
        id: "p1", productType: "GOODS", sellingPrice1: 10,
        sellingPrice2: null, stock: 5,
      })};

      await expect(
        service.create(mockPrisma as any, {
          customerId: "c1",
          items: [{ productId: "p1", quantity: 1, unitPrice: 10, priceTier: 2 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
