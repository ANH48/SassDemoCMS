# Phase 1: Foundation

## Context Links
- **Parent Plan:** [plan.md](./plan.md)
- **Architecture:** [system-architecture.md](../../docs/system-architecture.md) -- sections 2, 3, 4
- **Backend Research:** [backend-stack-latest-versions](./research/backend-stack-latest-versions-setup-patterns-feb-2026.md)
- **Frontend Research:** [frontend-stack-versions](./research/researcher-frontend-stack-versions-and-patterns.md)
- **Node.js Decision:** [nodejs-24-decision](./reports/brainstorm-nodejs-24-lts-upgrade-decision-and-compatibility-matrix.md)

## Overview
- **Date:** 2026-02-12
- **Priority:** P1
- **Effort:** 8h
- **Description:** Initialize Turborepo + pnpm monorepo with 3 apps and 4 packages. Docker Compose for PostgreSQL 17. Dual Prisma schemas. All root configs.
- **Implementation Status:** Complete
- **Review Status:** Verified (all 6 packages build successfully)

## Key Insights
- Turborepo 2.8.6 uses v2 config (`tasks` not `pipeline`); `turbo.jsonc` supported
- Tailwind CSS v4.1 uses `@import "tailwindcss"` pattern, no config file needed for basics
- shadcn/ui CLI auto-detects monorepo paths; unified `radix-ui` package replaces individual @radix-ui/*
- Prisma 7.2.0+ supports multi-file schemas; separate client generation per schema
- Node.js 24 has native .env loading (can skip dotenv)

## Requirements
**Functional:** Monorepo builds all apps/packages with `pnpm turbo build`. Docker starts PostgreSQL. Prisma generates both clients. All apps start on correct ports.
**Non-functional:** Fast dev rebuild via Turbopack. Type-safe shared packages. Reproducible env via Docker.

## Architecture
See Architecture doc sections 2-4. Monorepo: 3 apps + 4 packages. Separate DB per tenant strategy with dual Prisma schemas (global + tenant). TenantPrismaManager in packages/database.

## Related Code Files

**Files to create:**
```
# Root configs
.nvmrc
.env.example
.gitignore
.npmrc
pnpm-workspace.yaml
turbo.json
docker-compose.yml
package.json

# packages/database
packages/database/package.json
packages/database/tsconfig.json
packages/database/src/index.ts
packages/database/src/global-client.ts
packages/database/src/tenant-client.ts
packages/database/src/tenant-prisma-manager.ts
packages/database/prisma/global/schema.prisma
packages/database/prisma/tenant/schema.prisma

# packages/types
packages/types/package.json
packages/types/tsconfig.json
packages/types/src/index.ts
packages/types/src/auth.ts
packages/types/src/tenant.ts
packages/types/src/api-response.ts

# packages/config
packages/config/package.json
packages/config/tsconfig.base.json
packages/config/tsconfig.nextjs.json
packages/config/tsconfig.nestjs.json
packages/config/eslint.config.mjs

# packages/ui
packages/ui/package.json
packages/ui/tsconfig.json
packages/ui/src/index.ts
packages/ui/src/globals.css
packages/ui/components.json
packages/ui/tailwind.css

# apps/api
apps/api/package.json
apps/api/tsconfig.json
apps/api/tsconfig.build.json
apps/api/nest-cli.json
apps/api/src/main.ts
apps/api/src/app.module.ts

# apps/global-admin
apps/global-admin/package.json
apps/global-admin/tsconfig.json
apps/global-admin/next.config.ts
apps/global-admin/app/layout.tsx
apps/global-admin/app/page.tsx

# apps/tenant-admin
apps/tenant-admin/package.json
apps/tenant-admin/tsconfig.json
apps/tenant-admin/next.config.ts
apps/tenant-admin/app/layout.tsx
apps/tenant-admin/app/page.tsx
```

## Implementation Steps

**1. Initialize monorepo root**
```bash
mkdir saas-ecommerce && cd saas-ecommerce
pnpm init
```

Root `package.json`: set `"private": true`, engines `"node": ">=24.0.0"`, scripts: `"dev": "turbo dev"`, `"build": "turbo build"`, `"db:generate": "turbo db:generate"`, `"db:migrate": "turbo db:migrate"`.

**2. Create pnpm-workspace.yaml**
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

**3. Create turbo.json (v2)**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "outputs": ["dist/**", ".next/**"], "dependsOn": ["^build"] },
    "dev": { "cache": false, "persistent": true },
    "lint": { "dependsOn": ["^build"] },
    "db:generate": { "cache": false },
    "db:migrate": { "cache": false }
  }
}
```

**4. Create .nvmrc** -- content: `24`

**5. Create .env.example**
```
DATABASE_URL=postgresql://dev_user:dev_password@localhost:5432/saas_global
JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=1h
GLOBAL_ADMIN_EMAIL=admin@platform.com
GLOBAL_ADMIN_PASSWORD=admin123
```

**6. Create docker-compose.yml**
```yaml
services:
  postgres:
    image: postgres:17-alpine
    container_name: saas-postgres
    restart: always
    environment:
      POSTGRES_USER: dev_user
      POSTGRES_PASSWORD: dev_password
      POSTGRES_DB: saas_global
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dev_user"]
      interval: 10s
      timeout: 5s
      retries: 5
volumes:
  postgres_data:
    driver: local
```

**7. Create packages/config** -- TSConfig presets (base, nextjs, nestjs) + ESLint config

**8. Create packages/types** -- Export shared interfaces: `JwtPayload`, `TenantStatus`, `UserRole`, `ApiResponse<T>`, `PaginatedResponse<T>`

**9. Create packages/database** -- Dual Prisma schemas:

Global schema models: Tenant, GlobalUser, Plan, Subscription, Feature, TenantFeature, BillingRecord, AuditLog (see Architecture doc section 4).

Tenant schema models (CMS Billing enhanced):
- `TenantUser` -- Staff accounts within a tenant
- `ProductCategory` -- Hierarchical product grouping (self-referential: id, name, parentId, sortOrder)
- `Product` -- Unified product/service/material model with `ProductType` enum:
  - **ProductType enum:** GOODS (default), SERVICE_PACKAGE, MATERIAL_TRACKED, RAW_MATERIAL, SERVICE
  - **Pricing:** sellingPrice1 (required, Decimal(12,2)), sellingPrice2-4 (optional), importPrice, costPrice
  - **Category:** categoryId → ProductCategory
  - **Units:** unit (string), dosageUnit (string), conversionRate (Decimal(10,4), default 1)
  - **Inventory:** stock (Int), minStock (Int, optional)
  - **Commission:** commissionRate1-3 (Decimal(5,2), staff level percentages)
  - **Service fields:** treatmentCycleDays (Int), treatmentSessions (Int)
  - **Flags:** isDefault (Boolean), isOpenPrice (Boolean)
  - **Status:** ACTIVE/INACTIVE (soft delete)
- `PackageItem` -- Links SERVICE_PACKAGE parent product to child products with quantity (@@unique[parentProductId, childProductId])
- `Order` -- Customer purchases (customerId, total, status, timestamps)
- `OrderItem` -- Line items: productId (required), quantity, unitPrice (Decimal(12,2)), priceTier (Int 1-4), discount (Decimal(12,2)), staffId (for commission tracking)
- `Customer` -- Tenant's customer base (name, email, phone, address)
- `RevenueShare` -- Revenue split configuration (name, percentage, type)
- `ServiceRecord` -- Track service delivery: productId (must be SERVICE/SERVICE_PACKAGE type), customerId, staffId, status, completedAt

**Note:** The separate `Service` model has been removed. All item types (goods, services, materials, packages) are unified into the `Product` model with a `ProductType` enum. This matches the KiotViet-style POS billing pattern.

Export `TenantPrismaManager` class: `Map<string, { client: PrismaClient; lastUsed: number }>`. Methods: `getClient(tenantId, dbUrl)`, `evictIdle(maxIdleMs = 600000)`, `disconnectAll()`. Set `connection_limit=5` on each client.

Scripts: `"db:generate": "prisma generate --schema=prisma/global/schema.prisma && prisma generate --schema=prisma/tenant/schema.prisma"`, `"db:migrate": "prisma migrate deploy --schema=prisma/global/schema.prisma"`.

**10. Create packages/ui** -- Init shadcn/ui:
```bash
cd packages/ui
npx shadcn@latest init
```
Set up Tailwind CSS v4 with `@import "tailwindcss"` in `tailwind.css`. Add base components: Button, Input, Card.

**11. Create apps/api** -- NestJS 11 app scaffold:
```bash
npx @nestjs/cli new api --skip-git --package-manager pnpm
```
Set port 3001 in `main.ts`. Add workspace deps: `@repo/database`, `@repo/types`.

**12. Create apps/global-admin** -- Next.js 16:
```bash
npx create-next-app@latest global-admin --typescript --app --turbopack
```
Set port 3000. Add workspace deps: `@repo/ui`, `@repo/types`.

**13. Create apps/tenant-admin** -- Next.js 16:
```bash
npx create-next-app@latest tenant-admin --typescript --app --turbopack
```
Set port 3002. Add workspace deps: `@repo/ui`, `@repo/types`.

**14. Install all deps and verify**
```bash
pnpm install
pnpm turbo build
docker compose up -d
pnpm turbo db:generate
pnpm turbo db:migrate
```

## Todo List
- [ ] Init monorepo root (package.json, pnpm-workspace.yaml, turbo.json)
- [ ] Create root configs (.nvmrc, .env.example, .gitignore, .npmrc, docker-compose.yml)
- [ ] Create packages/config (TSConfig presets, ESLint)
- [ ] Create packages/types (shared interfaces)
- [ ] Create packages/database (dual Prisma schemas, TenantPrismaManager)
- [ ] Create packages/ui (shadcn/ui init, Tailwind v4, base components)
- [ ] Scaffold apps/api (NestJS 11)
- [ ] Scaffold apps/global-admin (Next.js 16)
- [ ] Scaffold apps/tenant-admin (Next.js 16)
- [ ] Verify: `pnpm install` resolves, `pnpm turbo build` succeeds
- [ ] Verify: `docker compose up` starts PostgreSQL
- [ ] Verify: Prisma generate + migrate works

## Success Criteria
- `pnpm install` resolves all workspace packages without errors
- `pnpm turbo build` compiles all 3 apps and 4 packages
- `docker compose up -d` starts PostgreSQL 17 with healthcheck passing
- `pnpm turbo db:generate` generates both global and tenant Prisma clients
- `pnpm turbo db:migrate` applies global schema migrations
- All apps start on correct ports (3000, 3001, 3002)

## Risk Assessment
| Risk | Mitigation |
|------|-----------|
| Prisma dual-schema generation conflicts | Separate output dirs, separate generate commands |
| Turborepo cache issues with Prisma | Set `"cache": false` for db tasks |
| pnpm workspace resolution failures | Use `workspace:*` protocol, verify with `pnpm ls` |
| Tailwind v4 breaking changes from v3 guides | Use CSS-first config, no tailwind.config.js |

## Security Considerations
- `.env` in `.gitignore` -- never commit secrets
- Docker PostgreSQL password required, not optional
- `engines` field enforces Node.js 24+ minimum

## Next Steps
- Proceed to [Phase 2: API Core](./phase-02-api-core.md) for auth, guards, and global admin modules
