# Phase 5: Tenant Admin Frontend

## Context Links
- **Parent Plan:** [plan.md](./plan.md)
- **Architecture:** [system-architecture.md](../../docs/system-architecture.md) -- section 8 (Tenant Admin App)
- **Depends on:** [Phase 3](./phase-03-tenant-api.md) (tenant API endpoints), [Phase 4](./phase-04-global-admin-frontend.md) (shared patterns)
- **Frontend Research:** [frontend-stack](./research/researcher-frontend-stack-versions-and-patterns.md)

## Overview
- **Date:** 2026-02-12
- **Priority:** P2
- **Effort:** 6h
- **Description:** Next.js 16 App Router for tenant admin portal. Login with tenantSlug context. Dashboard, product categories, enhanced product CRUD (CMS Billing with all product types, pricing tiers, packages), orders, customers, revenue share config, service record tracking, team management. No separate services page -- services are products with productType=SERVICE.
- **Implementation Status:** Pending
- **Review Status:** Not started

## Key Insights
- Same auth pattern as global admin but JWT carries `tenantId` + `tenantSlug`
- Tenant slug resolved from login form or subdomain (future)
- All API calls go to `/tenant/*` endpoints; backend guard chain ensures isolation
- Reuse shared components from packages/ui (DataTable, forms, dialogs)
- Server Components for list pages; Client Components for forms + interactive tables

## Requirements
**Functional:** Tenant user login with slug. Business dashboard with key metrics. Product categories management. Full CRUD for products (all types: goods, services, materials, service packages) with multi-tier pricing, commission rates, package items. Order management with price tier and staff selection. Revenue share configuration. Service record creation + completion (references products). Team (staff) management.
**Non-functional:** Auth middleware protection. Responsive design. Consistent UI with global admin. Fast dev rebuilds via Turbopack.

## Architecture
See Architecture doc section 8 (Tenant Admin App). App Router with `(auth)` and `(dashboard)` route groups. JWT contains tenantId/tenantSlug used by API guard chain.

## Related Code Files

**Files to create:**
```
# Auth
apps/tenant-admin/app/(auth)/login/page.tsx
apps/tenant-admin/app/(auth)/layout.tsx
apps/tenant-admin/middleware.ts

# Dashboard layout
apps/tenant-admin/app/(dashboard)/layout.tsx
apps/tenant-admin/app/(dashboard)/page.tsx

# Product Categories
apps/tenant-admin/app/(dashboard)/product-categories/page.tsx

# Product pages (CMS Billing enhanced)
apps/tenant-admin/app/(dashboard)/products/page.tsx
apps/tenant-admin/app/(dashboard)/products/new/page.tsx
apps/tenant-admin/app/(dashboard)/products/[id]/page.tsx

# Other pages
apps/tenant-admin/app/(dashboard)/orders/page.tsx
apps/tenant-admin/app/(dashboard)/orders/[id]/page.tsx
apps/tenant-admin/app/(dashboard)/customers/page.tsx
apps/tenant-admin/app/(dashboard)/revenue-shares/page.tsx
apps/tenant-admin/app/(dashboard)/service-records/page.tsx
apps/tenant-admin/app/(dashboard)/team/page.tsx
apps/tenant-admin/app/(dashboard)/settings/page.tsx

# Shared lib
apps/tenant-admin/lib/api-client.ts
apps/tenant-admin/lib/auth.ts
apps/tenant-admin/lib/constants.ts

# Components
apps/tenant-admin/components/sidebar.tsx
apps/tenant-admin/components/header.tsx
apps/tenant-admin/components/product-form.tsx
apps/tenant-admin/components/order-form.tsx
apps/tenant-admin/components/customer-form.tsx
apps/tenant-admin/components/service-record-form.tsx
```

## Implementation Steps

**1. Set up middleware.ts** -- Same pattern as global admin. Verify JWT cookie. Extract `tenantSlug` from token for display. Redirect to login if unauthorized.

**2. Create lib/api-client.ts** -- Same fetch wrapper pattern as global admin:
- Base URL: `NEXT_PUBLIC_API_URL` (default `http://localhost:3001`)
- JWT from cookie -> `Authorization: Bearer {token}`
- All requests go to `/tenant/*` prefix
- 401 -> redirect to login

**3. Create lib/auth.ts** -- Tenant login:
- POST to `/auth/tenant/login` with `{email, password, tenantSlug}`
- Store JWT in HttpOnly cookie
- Logout: clear cookie

**4. Create (auth)/login/page.tsx** -- Client Component:
- Fields: tenant slug, email, password
- Calls server action for tenant login
- Error display on failure
- Redirect to dashboard on success

**5. Create (dashboard)/layout.tsx** -- Sidebar nav: Dashboard, Product Categories, Products, Orders, Customers, Revenue Shares, Service Records, Team, Settings. Header with tenant name (from JWT) + user info + logout. (No separate Services nav -- services are products with productType=SERVICE).

**6. Create (dashboard)/page.tsx** -- Business dashboard:
- Key metrics cards: total products, total orders (today/week/month), total revenue, active services
- Recent orders list
- Upcoming service records

**7. Create (dashboard)/product-categories/page.tsx** -- Product categories:
- DataTable: name, parent category, sort order
- Create/edit category form; delete (fails if products assigned)

**8. Create (dashboard)/products/page.tsx** -- Product list (CMS Billing):
- DataTable: name, SKU, productType, sellingPrice1, stock, status, category
- Filter by: search (name/SKU), categoryId, productType, status
- "New Product" button; link to detail page

**9. Create (dashboard)/products/new/page.tsx** -- Create product form (CMS Billing):
- Product type selector (GOODS, SERVICE, SERVICE_PACKAGE, MATERIAL_TRACKED, RAW_MATERIAL)
- Fields: name, SKU, description, category, unit, dosageUnit, conversionRate
- Pricing: sellingPrice1-4, importPrice, costPrice
- Inventory: stock, minStock (hidden for non-inventory types)
- Commission: commissionRate1-3
- Service fields: treatmentCycleDays, treatmentSessions (shown for SERVICE/SERVICE_PACKAGE)
- Flags: isDefault, isOpenPrice
- POST to `/tenant/products`; redirect to list on success

**10. Create (dashboard)/products/[id]/page.tsx** -- Product detail + edit:
- Display all product info; edit form; PATCH to `/tenant/products/:id`; delete button
- If SERVICE_PACKAGE: show package items list with add/remove sub-items

**11. Create (dashboard)/orders/page.tsx** -- Order list:
- DataTable: order ID, customer, total, status, date; "New Order" button

**12. Create (dashboard)/orders/[id]/page.tsx** -- Order detail:
- Order info + line items table (with priceTier, discount, staffId); status update dropdown

**13. Create (dashboard)/customers/page.tsx** -- Customer list + create:
- DataTable: name, email, phone; create/edit in dialog

**14. Create (dashboard)/revenue-shares/page.tsx** -- Revenue share config:
- List shares (name, percentage, type); create + edit forms

**15. Create (dashboard)/service-records/page.tsx** -- Service records:
- DataTable: service, customer, staff, status, date; "Complete" action per row

**16. Create (dashboard)/team/page.tsx** -- Team management:
- List staff; "Add Member" form: name, email, password, role

**17. Create (dashboard)/settings/page.tsx** -- Tenant settings (placeholder)

## Todo List
- [ ] Set up middleware.ts with JWT verification
- [ ] Create lib/api-client.ts + lib/auth.ts
- [ ] Build login page (with tenant slug field)
- [ ] Build dashboard layout (sidebar + header with tenant name)
- [ ] Build business dashboard page (metrics + recent data)
- [ ] Build product categories page
- [ ] Build products pages (list with filters, create with all CMS billing fields, detail with package items)
- [ ] Build orders pages (list, detail with priceTier/staffId/discount)
- [ ] Build customers page
- [ ] Build revenue shares page
- [ ] Build service records page (with completion action)
- [ ] Build team management page
- [ ] Build settings page (placeholder)

## Success Criteria
- Tenant user can login with slug + credentials
- Middleware blocks unauthenticated access
- All CRUD operations work: product categories, products (all types), customers, orders
- Order status updates reflected immediately
- Service record completion sets timestamp
- Team member creation works with password
- Tenant name displayed in header (from JWT payload)

## Risk Assessment
| Risk | Mitigation |
|------|-----------|
| CORS for tenant-admin on port 3002 | Add 3002 to NestJS CORS origins |
| Tenant slug confusion | Display slug in header; validate on login |
| Large product lists | Pagination params sent to API (Phase 6 adds full pagination) |

## Security Considerations
- JWT in HttpOnly cookie (same pattern as global admin)
- Middleware verifies token + tenantSlug presence
- No cross-tenant data exposure (enforced server-side by TenantContextGuard)
- Password field for team creation uses `type="password"`
- No tenant DB URLs or secrets exposed to frontend

## Next Steps
- Proceed to [Phase 6: Polish](./phase-06-polish.md) for error handling, pagination, tests, docs
