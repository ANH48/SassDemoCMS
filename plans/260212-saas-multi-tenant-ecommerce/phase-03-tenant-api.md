# Phase 3: Tenant API (CMS Billing)

## Context Links
- **Parent Plan:** [plan.md](./plan.md)
- **Architecture:** [system-architecture.md](../../docs/system-architecture.md) -- section 6 (Tenant Admin Routes)
- **Depends on:** [Phase 2](./phase-02-api-core.md) (auth guards, TenantContextGuard, database module)
- **CMS Billing Plan:** [cms-billing-plan](/Users/nhut/.claude-work/plans/zany-rolling-clover.md)

## Overview
- **Date:** 2026-02-13
- **Priority:** P1
- **Effort:** 10h
- **Description:** All tenant-scoped NestJS modules with enhanced CMS Billing (KiotViet-style POS). Unified Product model replaces separate Product + Service models. 7 modules: ProductCategories, Products, Orders, Customers, RevenueShares, ServiceRecords, Team.
- **Implementation Status:** Pending
- **Review Status:** Not started

## Key Insights
- Every tenant endpoint goes through full guard chain: JwtAuthGuard -> RolesGuard -> TenantContextGuard
- `request.tenantPrisma` is a PrismaClient connected to that tenant's isolated DB
- All modules follow same pattern: Module + Controller + Service + DTOs
- **Unified Product model**: All item types (goods, services, materials, packages) are a `Product` with `ProductType` enum
- **No separate Service model**: Services are Products with `productType = SERVICE`
- OrderItem uses only `productId` (no polymorphic serviceId), with `priceTier` for multi-tier pricing
- Product type determines behavior flags (hasInventory, canSell, canBuy) via application-layer utility

## Requirements
**Functional:** Product categories CRUD. Full CRUD for products (all types: goods, services, materials, packages). Package item management for SERVICE_PACKAGE products. Order creation with price tier selection and staff assignment. Revenue share config. Service record tracking with completion. Team management.
**Non-functional:** All inputs validated via class-validator DTOs. Consistent response format. Tenant data isolation enforced by guard.

## Architecture
See Architecture doc section 6 (Tenant Admin Routes) and section 9 (Tenant Admin Request Flow). Guard chain attaches `tenantPrisma` to request. Services receive PrismaClient from controller.

Pattern per module:
```
Controller (@UseGuards(JwtAuthGuard, RolesGuard, TenantContextGuard))
  -> injects request.tenantPrisma
  -> passes to Service method
  -> Service queries tenant DB via PrismaClient
```

**Product Type Behavior Matrix** (derived at application layer, not stored in DB):

| ProductType | hasInventory | canSell | canBuy |
|---|---|---|---|
| GOODS | yes | yes | yes |
| SERVICE_PACKAGE | no | yes | no |
| MATERIAL_TRACKED | yes | yes | yes |
| RAW_MATERIAL | yes | no | yes |
| SERVICE | no | yes | no |

## Related Code Files

**Files to create:**
```
# Product Type Behavior Utility
apps/api/src/tenant/products/product-type-behavior.ts

# Product Categories
apps/api/src/tenant/product-categories/product-categories.module.ts
apps/api/src/tenant/product-categories/product-categories.controller.ts
apps/api/src/tenant/product-categories/product-categories.service.ts
apps/api/src/tenant/product-categories/dto/create-product-category.dto.ts
apps/api/src/tenant/product-categories/dto/update-product-category.dto.ts

# Products (enhanced CMS Billing)
apps/api/src/tenant/products/products.module.ts
apps/api/src/tenant/products/products.controller.ts
apps/api/src/tenant/products/products.service.ts
apps/api/src/tenant/products/dto/create-product.dto.ts
apps/api/src/tenant/products/dto/update-product.dto.ts
apps/api/src/tenant/products/dto/query-product.dto.ts
apps/api/src/tenant/products/dto/manage-package-items.dto.ts

# Orders
apps/api/src/tenant/orders/orders.module.ts
apps/api/src/tenant/orders/orders.controller.ts
apps/api/src/tenant/orders/orders.service.ts
apps/api/src/tenant/orders/dto/create-order.dto.ts
apps/api/src/tenant/orders/dto/update-order-status.dto.ts

# Customers
apps/api/src/tenant/customers/customers.module.ts
apps/api/src/tenant/customers/customers.controller.ts
apps/api/src/tenant/customers/customers.service.ts
apps/api/src/tenant/customers/dto/create-customer.dto.ts
apps/api/src/tenant/customers/dto/update-customer.dto.ts

# Revenue Shares
apps/api/src/tenant/revenue-shares/revenue-shares.module.ts
apps/api/src/tenant/revenue-shares/revenue-shares.controller.ts
apps/api/src/tenant/revenue-shares/revenue-shares.service.ts
apps/api/src/tenant/revenue-shares/dto/create-revenue-share.dto.ts
apps/api/src/tenant/revenue-shares/dto/update-revenue-share.dto.ts

# Service Records
apps/api/src/tenant/service-records/service-records.module.ts
apps/api/src/tenant/service-records/service-records.controller.ts
apps/api/src/tenant/service-records/service-records.service.ts
apps/api/src/tenant/service-records/dto/create-service-record.dto.ts

# Team
apps/api/src/tenant/team/team.module.ts
apps/api/src/tenant/team/team.controller.ts
apps/api/src/tenant/team/team.service.ts
apps/api/src/tenant/team/dto/create-team-member.dto.ts

# Tenant module aggregator
apps/api/src/tenant/tenant.module.ts
```

**Files NOT created (removed):**
```
# Services module removed -- unified into Product with productType = SERVICE
apps/api/src/tenant/services/*
```

## Implementation Steps

**1. Create product-type-behavior.ts utility**

```typescript
export interface ProductBehavior {
  hasInventory: boolean;
  canSell: boolean;
  canBuy: boolean;
}

const BEHAVIOR_MAP: Record<string, ProductBehavior> = {
  GOODS:            { hasInventory: true,  canSell: true,  canBuy: true  },
  SERVICE_PACKAGE:  { hasInventory: false, canSell: true,  canBuy: false },
  MATERIAL_TRACKED: { hasInventory: true,  canSell: true,  canBuy: true  },
  RAW_MATERIAL:     { hasInventory: true,  canSell: false, canBuy: true  },
  SERVICE:          { hasInventory: false, canSell: true,  canBuy: false },
};

export function getProductBehavior(productType: string): ProductBehavior {
  return BEHAVIOR_MAP[productType] ?? BEHAVIOR_MAP.GOODS;
}
```

**2. Create TenantModule (aggregator)** -- Imports 7 sub-modules (ProductCategories, Products, Orders, Customers, RevenueShares, ServiceRecords, Team). Applied to `/tenant` route prefix.

**3. Create ProductCategoriesModule**

Endpoints:
- `GET /tenant/product-categories` -- List all categories (flat with parentId)
- `POST /tenant/product-categories` -- Create category
- `PATCH /tenant/product-categories/:id` -- Update category
- `DELETE /tenant/product-categories/:id` -- Delete (fails if products assigned)

CreateProductCategoryDto: `name` (string, 1-100, required), `parentId` (uuid, optional), `sortOrder` (int, min 0, optional).

Service: `delete` checks for products with this categoryId; throws 400 if any exist.

**4. Create ProductsModule (CMS Billing Enhanced)**

Endpoints:
- `GET /tenant/products` -- List products with filtering (QueryProductDto)
- `POST /tenant/products` -- Create product (all fields)
- `GET /tenant/products/:id` -- Product detail (includes category, package items)
- `PATCH /tenant/products/:id` -- Update product
- `DELETE /tenant/products/:id` -- Soft delete (set status INACTIVE)
- `GET /tenant/products/:id/package-items` -- List sub-items of a service package
- `POST /tenant/products/:id/package-items` -- Add sub-item to package
- `DELETE /tenant/products/:id/package-items/:itemId` -- Remove sub-item

CreateProductDto:
- `name` (string, 1-200, required)
- `sku` (string, optional, unique)
- `description` (string, optional)
- `productType` (enum: GOODS/SERVICE_PACKAGE/MATERIAL_TRACKED/RAW_MATERIAL/SERVICE, default GOODS)
- `categoryId` (uuid, optional)
- `sellingPrice1` (number, min 0, required) -- primary selling price
- `sellingPrice2` (number, min 0, optional)
- `sellingPrice3` (number, min 0, optional)
- `sellingPrice4` (number, min 0, optional)
- `importPrice` (number, min 0, optional)
- `costPrice` (number, min 0, optional)
- `unit` (string, optional) -- e.g., "kg", "piece", "bottle"
- `dosageUnit` (string, optional) -- secondary unit
- `conversionRate` (number, min 0, optional, default 1)
- `stock` (int, min 0, optional)
- `minStock` (int, min 0, optional)
- `commissionRate1` (number, 0-100, optional) -- staff level 1 commission %
- `commissionRate2` (number, 0-100, optional)
- `commissionRate3` (number, 0-100, optional)
- `treatmentCycleDays` (int, min 1, optional)
- `treatmentSessions` (int, min 1, optional)
- `isDefault` (boolean, optional)
- `isOpenPrice` (boolean, optional)

QueryProductDto: `search` (string, name/SKU search), `categoryId` (uuid), `productType` (enum), `status` (string).

AddPackageItemDto: `childProductId` (uuid, required), `quantity` (int, min 1).

Validation rules:
- Package items only allowed on `productType = SERVICE_PACKAGE`
- No circular references (child cannot equal parent)
- Ignore stock/minStock for types without inventory (SERVICE, SERVICE_PACKAGE)

**5. Create OrdersModule**

Endpoints:
- `GET /tenant/orders` -- List orders (with customer relation)
- `POST /tenant/orders` -- Create order with line items
- `PATCH /tenant/orders/:id/status` -- Update order status

CreateOrderDto: `customerId` (uuid, required), `items` (array of CreateOrderItemDto).

CreateOrderItemDto:
- `productId` (uuid, required)
- `quantity` (int, min 1)
- `unitPrice` (number, min 0)
- `priceTier` (int, 1-4, optional) -- which selling price tier was used
- `discount` (number, min 0, optional, default 0)
- `staffId` (uuid, optional) -- staff who served/sold (for commission)

UpdateOrderStatusDto: `status` (enum: PENDING/CONFIRMED/PROCESSING/COMPLETED/CANCELLED).

Order creation: wrap in transaction -- create Order, create OrderItems, update product stock (decrement by quantity) **only for products where `hasInventory = true`** (GOODS, MATERIAL_TRACKED, RAW_MATERIAL). Validate priceTier maps to non-null sellingPriceN on the product.

**6. Create CustomersModule**

Endpoints:
- `GET /tenant/customers` -- List customers
- `POST /tenant/customers` -- Create customer
- `PATCH /tenant/customers/:id` -- Update customer

CreateCustomerDto: `name` (string, required), `email` (string, email format), `phone` (string, optional), `address` (string, optional).

**7. Create RevenueSharesModule**

Endpoints:
- `GET /tenant/revenue-shares` -- List revenue share configs
- `POST /tenant/revenue-shares` -- Create revenue share
- `PATCH /tenant/revenue-shares/:id` -- Update revenue share

CreateRevenueShareDto: `name` (string, required), `percentage` (number, 0-100), `type` (string, e.g., "STAFF", "OWNER", "PLATFORM").

**8. Create ServiceRecordsModule**

Endpoints:
- `GET /tenant/service-records` -- List service records
- `POST /tenant/service-records` -- Create service record
- `PATCH /tenant/service-records/:id/complete` -- Mark completed (set `completedAt: new Date()`, status COMPLETED)

CreateServiceRecordDto: `productId` (uuid, required -- must reference a Product with productType SERVICE or SERVICE_PACKAGE), `customerId` (uuid), `staffId` (uuid), `notes` (string, optional).

**9. Create TeamModule**

Endpoints:
- `GET /tenant/team` -- List tenant users/staff
- `POST /tenant/team` -- Create staff member (hash password with bcrypt)

CreateTeamMemberDto: `name` (string, required), `email` (string, email), `password` (string, min 8), `role` (enum: TENANT_ADMIN/TENANT_USER).

**10. Register all in AppModule** -- Import TenantModule into root AppModule.

## Todo List
- [ ] Create product-type-behavior.ts utility
- [ ] Create TenantModule aggregator
- [ ] Implement ProductCategoriesModule (CRUD with hierarchy)
- [ ] Implement ProductsModule (enhanced CMS Billing CRUD + package items)
- [ ] Implement OrdersModule (list, create with priceTier + staffId + inventory-aware stock, status update)
- [ ] Implement CustomersModule (CRUD)
- [ ] Implement RevenueSharesModule (CRUD)
- [ ] Implement ServiceRecordsModule (create with productId + complete)
- [ ] Implement TeamModule (list + create with bcrypt)
- [ ] Register TenantModule in AppModule
- [ ] Test: Each endpoint returns correct data from isolated tenant DB
- [ ] Test: Guard chain blocks unauthorized access
- [ ] Test: Stock only decrements for inventory-tracked product types
- [ ] Test: Package items only allowed on SERVICE_PACKAGE products

## Success Criteria
- All tenant endpoints return correct responses (200/201/400/401/403)
- Product CRUD supports all 5 product types with correct fields
- Product categories support hierarchical grouping
- Package items can be added/removed from SERVICE_PACKAGE products
- Stock decrements on order creation **only for inventory-tracked types**
- Price tier selection works correctly (priceTier 1-4 maps to sellingPriceN)
- Service record creation validates productType is SERVICE or SERVICE_PACKAGE
- Service record completion sets `completedAt` timestamp
- Team member creation hashes password (never stored plaintext)
- All DTOs validate input; invalid requests return 400 with details
- Data isolation verified: tenant A cannot see tenant B data

## Risk Assessment
| Risk | Mitigation |
|------|-----------|
| tenantPrisma undefined on request | TenantContextGuard throws 403 before handler runs |
| Stock going negative on concurrent orders | Prisma transaction with stock check inside |
| Orphaned order items | Transaction wraps order + items creation |
| Circular package references | Validate child != parent in service layer |
| Price tier referencing null price | Validate priceTier maps to non-null sellingPriceN |

## Security Considerations
- Guard chain on every endpoint (JwtAuthGuard + RolesGuard + TenantContextGuard)
- Tenant users only access their own DB (enforced by TenantContextGuard)
- bcrypt for team member passwords
- class-validator whitelist strips unknown fields from DTOs
- UUID validation on all ID params

## Next Steps
- Proceed to [Phase 4: Global Admin Frontend](./phase-04-global-admin-frontend.md)
