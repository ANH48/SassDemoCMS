# SaaS Multi-Tenant E-Commerce Platform - System Architecture

## 1. Vision

A multi-tenant SaaS CMS platform where:

- **Global Admin** manages tenants, billing, subscriptions, feature toggles
- **Tenant Admin** is a client business (barbershop, health device store, etc.) that manages orders, products, services, revenue sharing
- Each tenant gets **complete data isolation** with a separate PostgreSQL database

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 + React 19 + TypeScript |
| UI Library | shadcn/ui + Tailwind CSS |
| Backend | NestJS + Prisma ORM |
| Database | PostgreSQL 17-alpine (separate DB per tenant) |
| Job Queue | BullMQ + Redis 7-alpine (async provisioning, notifications) |
| Monorepo | Turborepo + pnpm workspaces |
| Auth | JWT with role-based access control |
| Containerization | Docker Compose (local dev) |

---

## 3. Monorepo Structure

```
saas-ecommerce/
├── apps/
│   ├── global-admin/          # Next.js 16 - port 3000
│   ├── tenant-admin/          # Next.js 16 - port 3002
│   └── api/                   # NestJS   - port 3001
│
├── packages/
│   ├── ui/                    # shadcn/ui shared components
│   ├── types/                 # Shared TypeScript types
│   ├── config/                # ESLint, TSConfig presets
│   ├── database/              # Prisma schemas + connection manager
│   └── lib/                   # Shared auth utils, API client, middleware
│
├── docs/
├── plans/
├── turbo.json
├── pnpm-workspace.yaml
├── docker-compose.yml
└── .env.example
```

---

## 4. Database Architecture

### Strategy: Separate Database Per Tenant

Each tenant gets its own PostgreSQL database for complete data isolation.

```
┌──────────────────────────────┐
│       GLOBAL DATABASE        │
│       (saas_global)          │
│                              │
│  tenants | plans | features  │
│  global_users | subscriptions│
│  billing_records | audit_logs│
│  tenant_features             │
└──────────┬───────────────────┘
           │
     ┌─────┼──────────┐
     │     │          │
┌────▼──┐ ┌▼───────┐ ┌▼───────┐
│ DB:   │ │ DB:    │ │ DB:    │
│ t_001 │ │ t_002  │ │ t_00N  │
│       │ │        │ │        │
│product_│ │product_│ │product_│
│categors│ │categors│ │categors│
│products│ │products│ │products│
│package_│ │package_│ │package_│
│ items  │ │ items  │ │ items  │
│orders  │ │orders  │ │orders  │
│customers││customers││customers│
│tenant_ │ │tenant_ │ │tenant_ │
│ users  │ │ users  │ │ users  │
│revenue_│ │revenue_│ │revenue_│
│ shares │ │ shares │ │ shares │
│service_│ │service_│ │service_│
│records │ │records │ │records │
└────────┘ └────────┘ └────────┘
```

### Two Prisma Schemas

| Schema | Path | Generated Client |
|--------|------|-----------------|
| Global | `packages/database/prisma/global/schema.prisma` | `@prisma/global-client` |
| Tenant | `packages/database/prisma/tenant/schema.prisma` | `@prisma/tenant-client` |

### Global Schema Models

| Model | Purpose |
|-------|---------|
| `Tenant` | Registered businesses (slug, name, status, databaseUrl) |
| `GlobalUser` | Platform admin accounts |
| `Plan` | Subscription tiers (Basic, Pro, Enterprise) |
| `Subscription` | Links tenant to plan (with rentalFee, billing cycle) |
| `Feature` | Available feature flags |
| `TenantFeature` | Feature toggles per tenant |
| `BillingRecord` | Payment/invoice tracking |
| `AuditLog` | Platform-wide activity log |

### Tenant Schema Models (CMS Billing Enhanced)

| Model | Purpose |
|-------|---------|
| `TenantUser` | Staff accounts within a tenant |
| `ProductCategory` | Hierarchical product grouping (self-referential parent/child) |
| `Product` | Unified product/service/material model with `ProductType` enum |
| `PackageItem` | Sub-items within a SERVICE_PACKAGE product (parent-child with quantity) |
| `Order` | Customer purchases |
| `OrderItem` | Line items with priceTier (1-4), discount, and staffId for commission |
| `Customer` | Tenant's customer base |
| `RevenueShare` | Revenue split configuration between parties |
| `ServiceRecord` | Track service delivery (references Product with type SERVICE/SERVICE_PACKAGE) |

**ProductType Enum:** `GOODS` (default), `SERVICE_PACKAGE`, `MATERIAL_TRACKED`, `RAW_MATERIAL`, `SERVICE`

**Product Type Behavior** (derived at application layer):

| ProductType | hasInventory | canSell | canBuy |
|---|---|---|---|
| GOODS | yes | yes | yes |
| SERVICE_PACKAGE | no | yes | no |
| MATERIAL_TRACKED | yes | yes | yes |
| RAW_MATERIAL | yes | no | yes |
| SERVICE | no | yes | no |

**Note:** The separate `Service` model has been removed. All item types are unified into `Product` with the `ProductType` enum, matching KiotViet-style POS billing pattern.

### Connection Management

- **TenantPrismaManager**: In-memory `Map<tenantId, PrismaClient>` with LRU eviction (10 min idle)
- Each tenant client uses `connection_limit=5` to keep pool small
- PgBouncer in front for production pooling

---

## 5. Authentication & Authorization

### JWT Token Payloads

**Global Admin Token:**
```json
{
  "sub": "user-uuid",
  "email": "admin@platform.com",
  "role": "GLOBAL_ADMIN",
  "type": "global"
}
```

**Tenant User Token:**
```json
{
  "sub": "user-uuid",
  "email": "staff@barbershop.com",
  "role": "TENANT_ADMIN",
  "type": "tenant",
  "tenantId": "tenant-uuid",
  "tenantSlug": "cool-barbershop"
}
```

### Guard Chain

```
Request --> JwtAuthGuard --> RolesGuard --> TenantContextGuard --> Handler
```

| Guard | Responsibility |
|-------|---------------|
| `JwtAuthGuard` | Validates JWT, extracts payload |
| `RolesGuard` | Checks user role matches required roles |
| `TenantContextGuard` | Resolves tenant DB URL, creates/caches PrismaClient, attaches to `request.tenantPrisma` |

### Route Organization

| Prefix | Access | Guard |
|--------|--------|-------|
| `/auth/*` | Public | None |
| `/global/*` | GLOBAL_ADMIN only | JwtAuthGuard + RolesGuard |
| `/tenant/*` | TENANT_ADMIN or TENANT_USER | JwtAuthGuard + RolesGuard + TenantContextGuard |

---

## 6. API Endpoints

### Global Admin Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/auth/global/login` | Global admin login |
| GET | `/global/tenants` | List all tenants |
| POST | `/global/tenants` | Create tenant (triggers provisioning) |
| GET | `/global/tenants/:id` | Tenant detail |
| PATCH | `/global/tenants/:id` | Update tenant |
| DELETE | `/global/tenants/:id` | Suspend/delete tenant |
| GET | `/global/plans` | List subscription plans |
| POST | `/global/plans` | Create plan |
| POST | `/global/subscriptions` | Assign plan to tenant |
| PATCH | `/global/subscriptions/:id` | Update subscription |
| PATCH | `/global/subscriptions/:id/rental-fee` | Set rental fee |
| GET | `/global/features` | List features |
| POST | `/global/features` | Create feature |
| POST | `/global/tenants/:id/features` | Toggle feature for tenant |
| GET | `/global/billing` | Billing overview |

### Tenant Admin Routes (CMS Billing Enhanced)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/auth/tenant/login` | Tenant user login |
| GET/POST/PATCH/DELETE | `/tenant/product-categories` | CRUD product categories (hierarchical) |
| GET/POST/PATCH/DELETE | `/tenant/products` | CRUD products (all types: goods, services, materials, packages) |
| GET | `/tenant/products?search=&categoryId=&productType=&status=` | List with filtering |
| GET/POST/DELETE | `/tenant/products/:id/package-items` | Manage service package sub-items |
| GET/POST | `/tenant/orders` | List / Create orders (with priceTier, staffId per item) |
| PATCH | `/tenant/orders/:id/status` | Update order status |
| GET/POST/PATCH | `/tenant/customers` | CRUD customers |
| GET/POST/PATCH | `/tenant/revenue-shares` | Configure revenue split |
| GET/POST | `/tenant/service-records` | Track service completions (productId, not serviceId) |
| PATCH | `/tenant/service-records/:id/complete` | Mark service completed |
| GET/POST | `/tenant/team` | Manage tenant staff |

---

## 7. Tenant Provisioning Flow (Async with BullMQ)

### Request-Response
```
Global Admin UI            API                  Redis Queue
     │                      │                        │
     ├─ POST /global/tenants ──>│                     │
     │                      ├─ Insert global DB    │
     │                      ├─ Enqueue job ───────>│
     │<── 202 Accepted ─────┤ { jobId, status }    │
     │   + jobId            │
     │
     ├─ Poll /global/jobs/:jobId ──>
     │                      ├─ Check Redis        │
     │<── 200 { status, progress }   │
```

### Background Job Processing
```
Redis Queue                BullMQ Worker       PostgreSQL
    │ job: {              │                        │
    │  tenantId,          │                        │
    │  slug,              │                        │
    │  name,              │                        │
    │  planId             │                        │
    │ }                   │                        │
    │                     ├─ CREATE DATABASE ────>│
    │                     │    saas_tenant_{slug} │
    │                     ├─ prisma migrate ─────>│
    │                     │    deploy             │
    │                     ├─ Seed TENANT_ADMIN ──>│
    │                     ├─ Update tenant ──────>│
    │                     │    status: ACTIVE     │
    │                     ├─ Create subscription ─>
    │ mark complete <─────┤                        │
```

### Provisioning Status Values
- `QUEUED`: Job enqueued, awaiting worker
- `PROVISIONING`: Worker executing CREATE DATABASE + migrations + seed
- `ACTIVE`: Provisioning complete, tenant ready
- `FAILED`: Provisioning failed, check logs

### Polling Endpoint
`GET /global/jobs/:jobId` returns:
```json
{
  "jobId": "uuid",
  "status": "ACTIVE" | "QUEUED" | "PROVISIONING" | "FAILED",
  "progress": 75,
  "message": "Seeding admin user...",
  "error": null
}
```

---

## 8. Custom Domain Architecture

### Hostname Resolution Chain

```
Request arrives        Middleware              Tenant Resolution
    │                    │                           │
 example.com             ├─ Extract Host header     │
 t-001.app.com           │ + protocol               │
 app.com                 │                           │
                         ├─ Check global domain? ───>│
                         │  (app.com)                │
                         │  └─ use slug from JWT     │
                         │                           │
                         ├─ Check custom domain? ───>│
                         │  (example.com)            │
                         │  ├─ lookup in DB          │
                         │  ├─ verify DNS record     │
                         │  └─ return tenantId       │
                         │                           │
                         ├─ Check subdomain pattern? ──>
                         │  (t-001.app.com)          │
                         │  ├─ extract slug          │
                         │  └─ return tenantId       │
```

### Domain Verification Flow

Custom domain support includes:

1. **Domain Registration**: Tenant provides domain (example.com)
2. **DNS Verification**: Admin adds TXT record `_saas-verify.example.com = tenant-uuid`
3. **Verification Endpoint**: `POST /tenant/domains/verify` → checks DNS, stores verified domain
4. **SSL Provisioning**: Automatic via Let's Encrypt (Certbot) or Cloudflare
5. **Routing**: Wildcard DNS or reverse proxy resolves custom domain to API

### Supported Domain Patterns

| Pattern | Example | Resolution |
|---------|---------|-----------|
| Global domain | app.com/login?slug=barbershop-1 | Tenant ID from JWT |
| Subdomain | barbershop-1.app.com | Extract `barbershop-1`, lookup slug |
| Custom domain | example.com | Lookup custom domain registration in DB |

### Frontend Routing
- **Global Admin**: Always accesses via `global-admin.app.com` or `admin.app.com`
- **Tenant Admin**: Routes based on Host header middleware:
  - If custom domain (example.com) → fetch tenant context from DB
  - If subdomain (tenant-slug.app.com) → extract from subdomain
  - If global domain with JWT → use JWT tenantSlug

### Global Admin App (`apps/global-admin`)

```
app/
├── (auth)/
│   └── login/page.tsx
└── (dashboard)/
    ├── layout.tsx              # Sidebar + header
    ├── page.tsx                # Dashboard overview
    ├── tenants/
    │   ├── page.tsx            # Tenant list
    │   ├── [id]/page.tsx       # Tenant detail
    │   └── new/page.tsx        # Create tenant
    ├── plans/page.tsx          # Plan management
    ├── billing/page.tsx        # Billing overview
    ├── features/page.tsx       # Feature flag management
    └── settings/page.tsx       # Platform settings
```

### Tenant Admin App (`apps/tenant-admin`)

```
app/
├── (auth)/
│   └── login/page.tsx
└── (dashboard)/
    ├── layout.tsx              # Sidebar + header
    ├── page.tsx                # Business dashboard
    ├── product-categories/
    │   └── page.tsx            # Product category management (hierarchical)
    ├── products/
    │   ├── page.tsx            # Product list (with filters: search, category, type, status)
    │   ├── [id]/page.tsx       # Product detail (+ package items for SERVICE_PACKAGE)
    │   └── new/page.tsx        # Create product (CMS Billing: all types, pricing tiers, commissions)
    ├── orders/
    │   ├── page.tsx            # Order list
    │   └── [id]/page.tsx       # Order detail (priceTier, staffId, discount per item)
    ├── customers/page.tsx      # Customer management
    ├── service-records/page.tsx # Service tracking (references Product, not Service)
    ├── revenue-shares/page.tsx # Revenue config
    ├── team/page.tsx           # Staff management
    └── settings/page.tsx       # Tenant settings
```

### Shared UI Package (`packages/ui`)

Built on shadcn/ui with Tailwind CSS. Provides reusable components:
- Button, Input, Select, Dialog, Table, Card
- DataTable (with sorting, filtering, pagination)
- Sidebar, Header, Layout shells
- Form components with validation

---

## 9. Job Queue Architecture (BullMQ + Redis)

### Purpose
Background job processing for tenant provisioning and future extensibility (email notifications, webhooks, analytics).

### Setup
- **Redis 7-alpine**: In-memory message queue, Docker Compose service
- **BullMQ**: NestJS queue library with Bull Queue decorators
- **Worker Processor**: Dedicated job handler with retry logic and dead-letter queue

### Job Types

| Job | Queue | Processor | Retry | Timeout |
|-----|-------|-----------|-------|---------|
| `provision-tenant` | `tenants-queue` | TenantProvisionerWorker | 3 attempts | 5 min |
| `send-email` | `emails-queue` | EmailWorker | 5 attempts | 2 min |
| `generate-report` | `reports-queue` | ReportWorker | 2 attempts | 10 min |

### Error Handling
- Failed jobs → retry with exponential backoff
- Max retries exceeded → moved to dead-letter queue
- Admin monitoring endpoint: `GET /global/jobs/failed` lists dead-lettered jobs

### Scalability
- Multiple workers can process jobs in parallel
- Worker pool scales horizontally by running separate instances
- Redis acts as single source of truth for job state

### Global Admin Creates Tenant

```
Global Admin UI                  API                         Database
     │                            │                             │
     ├─ POST /global/tenants ────>│                             │
     │                            ├─ Insert into global.tenants─>│
     │                            ├─ CREATE DATABASE ──────────>│
     │                            ├─ prisma migrate deploy ────>│
     │                            ├─ Seed TENANT_ADMIN user ──>│
     │                            ├─ Update tenant status ─────>│
     │                            ├─ Create subscription ──────>│
     │<── 201 Created ───────────┤                             │
```

### Tenant Admin Request Flow

```
Tenant UI                     API                       Global DB    Tenant DB
    │                          │                           │            │
    ├─ GET /tenant/products ──>│                           │            │
    │                          ├─ JwtAuthGuard ──────────>│            │
    │                          ├─ RolesGuard                           │
    │                          ├─ TenantContextGuard                   │
    │                          │   ├─ Lookup tenant ─────>│            │
    │                          │   ├─ Get/create client                │
    │                          │   └─ Attach to request                │
    │                          ├─ Handler                              │
    │                          │   └─ Query products ────────────────>│
    │<── 200 Products[] ──────┤                                       │
```

---

## 11. Security Considerations

| Concern | Mitigation |
|---------|-----------|
| Tenant data isolation | Separate database per tenant |
| SQL injection | Prisma ORM parameterized queries |
| Auth bypass | Guard chain on every route |
| Token theft | Short-lived JWTs + refresh tokens |
| Privilege escalation | Role-based guards + tenant context validation |
| Secrets exposure | Environment variables, never committed |
| Cross-tenant access | TenantContextGuard ensures correct DB |
| Brute force attacks | Rate limiting via @nestjs/throttler (per IP + per user) |
| Domain verification | DNS TXT record validation before custom domain activation |

---

## 12. Scalability Notes

- **Horizontal**: Each tenant DB can be on different hosts
- **Connection pooling**: PgBouncer in production for PostgreSQL connections
- **Job queue scaling**: Multiple BullMQ workers process jobs in parallel
- **Redis cluster**: Redis can be clustered for high availability (future)
- **LRU eviction**: Idle tenant connections cleaned up after 10 min
- **Stateless API**: JWT-based, no server sessions
- **CDN**: Static assets via Next.js built-in optimization
- **Load balancing**: API layer can run behind reverse proxy (nginx, HAProxy)

---

## 13. Implementation Phases

| Phase | Focus | Effort | Status |
|-------|-------|--------|--------|
| Phase 1 | Foundation (monorepo, packages, docker, prisma, redis) | 10h | Pending |
| Phase 2 | API Core (auth, guards, async provisioning, BullMQ, global modules) | 12h | Pending |
| Phase 3 | Tenant API (product, service, order, customer modules) | 9h | Pending |
| Phase 4 | Global Admin Frontend (tenant mgmt, custom domains) | 8h | Pending |
| Phase 5 | Tenant Admin Frontend (custom domain routing) | 8h | Pending |
| Phase 6 | Polish (error handling, pagination, rate limiting, tests) | 8h | Pending |

---

## 14. Verification Checklist

- [ ] `pnpm install` resolves all workspaces
- [ ] `pnpm turbo build` builds all apps/packages
- [ ] `docker compose up` starts PostgreSQL
- [ ] `pnpm turbo db:generate && pnpm turbo db:migrate` applies schemas
- [ ] Global admin can login and create tenant (DB auto-provisioned)
- [ ] Tenant admin can login, CRUD products, create orders
- [ ] Each tenant's data is fully isolated in separate DB
