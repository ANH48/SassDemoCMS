# Architecture Brainstorm Report

**Date:** 2026-02-12
**Status:** Complete

---

## 1. Platform Vision

A multi-tenant SaaS CMS platform where:

- **Global Admin** manages tenants, billing, subscriptions, feature toggles
- **Tenant Admin** is a client business (barbershop, health device store, etc.) that manages orders, products, services, revenue sharing
- Each tenant gets **complete data isolation** with a separate PostgreSQL database

---

## 2. Tech Stack Decision

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | Next.js 16 + React 19 + TypeScript | Latest App Router, RSC support, strong typing |
| UI Library | shadcn/ui + Tailwind CSS | Composable, accessible, easy to customize |
| Backend | NestJS + Prisma ORM | Modular architecture, type-safe DB access |
| Database | PostgreSQL (separate DB per tenant) | Strong isolation, independent scaling |
| Monorepo | Turborepo + pnpm workspaces | Fast builds, shared packages, dependency dedup |
| Auth | JWT with RBAC | Stateless, scalable, role-based control |
| Containerization | Docker Compose | Consistent local dev environment |

---

## 3. Monorepo Layout

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
│   └── database/              # Prisma schemas + connection manager
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
│products│ │products│ │products│
│orders  │ │orders  │ │orders  │
│services│ │services│ │services│
│customers││customers││customers│
│tenant_ │ │tenant_ │ │tenant_ │
│ users  │ │ users  │ │ users  │
└────────┘ └────────┘ └────────┘
```

### Global Schema Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `Tenant` | Registered businesses | slug, name, status, databaseUrl |
| `GlobalUser` | Platform admin accounts | email, passwordHash, role |
| `Plan` | Subscription tiers | name, price, maxProducts, maxUsers |
| `Subscription` | Tenant-to-plan link | tenantId, planId, rentalFee, billingCycle, status |
| `Feature` | Available feature flags | key, name, description |
| `TenantFeature` | Feature toggles per tenant | tenantId, featureId, enabled |
| `BillingRecord` | Payment/invoice tracking | tenantId, amount, type, status |
| `AuditLog` | Platform-wide activity log | userId, action, resource, details |

### Tenant Schema Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| `TenantUser` | Staff accounts | email, passwordHash, role, name |
| `Product` | Physical goods | name, sku, price, stock, status |
| `Service` | Services offered | name, price, duration, status |
| `Order` | Customer purchases | customerId, total, status |
| `OrderItem` | Line items | orderId, productId/serviceId, qty, price |
| `Customer` | Tenant's customers | name, email, phone |
| `RevenueShare` | Revenue split config | name, percentage, type |
| `ServiceRecord` | Service delivery tracking | serviceId, customerId, staffId, status |

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

| Prefix | Access | Guards |
|--------|--------|--------|
| `/auth/*` | Public | None |
| `/global/*` | GLOBAL_ADMIN only | JwtAuthGuard + RolesGuard |
| `/tenant/*` | TENANT_ADMIN / TENANT_USER | JwtAuthGuard + RolesGuard + TenantContextGuard |

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

### Tenant Admin Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/auth/tenant/login` | Tenant user login |
| GET/POST/PATCH/DELETE | `/tenant/products` | CRUD products |
| GET/POST/PATCH | `/tenant/services` | CRUD services |
| GET/POST | `/tenant/orders` | List / Create orders |
| PATCH | `/tenant/orders/:id/status` | Update order status |
| GET/POST/PATCH | `/tenant/customers` | CRUD customers |
| GET/POST/PATCH | `/tenant/revenue-shares` | Configure revenue split |
| GET/POST | `/tenant/service-records` | Track service completions |
| PATCH | `/tenant/service-records/:id/complete` | Mark service completed |
| GET/POST | `/tenant/team` | Manage tenant staff |

---

## 7. Tenant Provisioning Flow

```
1. Global Admin creates tenant
   └── tenant.status = PROVISIONING

2. API executes CREATE DATABASE saas_tenant_{slug}

3. Runs prisma migrate deploy against new DB

4. Seeds default TENANT_ADMIN user

5. Updates tenant record
   ├── status = ACTIVE
   └── stores databaseUrl

6. Creates subscription linking tenant to plan
```

---

## 8. Frontend Architecture

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
    ├── plans/page.tsx
    ├── billing/page.tsx
    ├── features/page.tsx
    └── settings/page.tsx
```

### Tenant Admin App (`apps/tenant-admin`)

```
app/
├── (auth)/
│   └── login/page.tsx
└── (dashboard)/
    ├── layout.tsx              # Sidebar + header
    ├── page.tsx                # Business dashboard
    ├── products/
    │   ├── page.tsx
    │   ├── [id]/page.tsx
    │   └── new/page.tsx
    ├── services/page.tsx
    ├── orders/
    │   ├── page.tsx
    │   └── [id]/page.tsx
    ├── customers/page.tsx
    ├── service-records/page.tsx
    ├── revenue-shares/page.tsx
    ├── team/page.tsx
    └── settings/page.tsx
```

---

## 9. Data Flow Diagrams

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

## 10. Security Considerations

| Concern | Mitigation |
|---------|-----------|
| Tenant data isolation | Separate database per tenant |
| SQL injection | Prisma ORM parameterized queries |
| Auth bypass | Guard chain on every route |
| Token theft | Short-lived JWTs + refresh tokens |
| Privilege escalation | Role-based guards + tenant context validation |
| Secrets exposure | Environment variables, never committed |
| Cross-tenant access | TenantContextGuard ensures correct DB |

---

## 11. Scalability Notes

- **Horizontal**: Each tenant DB can be on different hosts
- **Connection pooling**: PgBouncer in production
- **LRU eviction**: Idle tenant connections cleaned up after 10 min
- **Stateless API**: JWT-based, no server sessions
- **CDN**: Static assets via Next.js built-in optimization

---

## 12. Key Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| DB sprawl with many tenants | Resource usage | PgBouncer + connection limits + LRU |
| Schema drift across tenant DBs | Data inconsistency | Single migration source, automated deploy |
| Tenant DB provisioning failure | Broken onboarding | Status tracking, rollback on failure |
| JWT secret compromise | Auth bypass | Rotate secrets, short expiry |
| Single API bottleneck | Performance | Stateless design, horizontal scaling |
