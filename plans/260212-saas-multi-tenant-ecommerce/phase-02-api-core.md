# Phase 2: API Core

## Context Links
- **Parent Plan:** [plan.md](./plan.md)
- **Architecture:** [system-architecture.md](../../docs/system-architecture.md) -- sections 5, 6, 7
- **Depends on:** [Phase 1](./phase-01-foundation.md) (monorepo + database package)
- **Backend Research:** [backend-stack](./research/backend-stack-latest-versions-setup-patterns-feb-2026.md)

## Overview
- **Date:** 2026-02-12
- **Priority:** P1
- **Effort:** 10h
- **Description:** NestJS JWT auth, guard chain (JwtAuth + Roles + TenantContext), TenantPrismaManager integration, tenant provisioning flow, all 15 global admin API endpoints.
- **Implementation Status:** Pending
- **Review Status:** Not started

## Key Insights
- Guard chain order critical: JwtAuthGuard -> RolesGuard -> TenantContextGuard (see Architecture section 5)
- TenantPrismaManager uses LRU eviction at 10 min idle; connection_limit=5 per client
- Tenant provisioning: CREATE DATABASE -> prisma migrate deploy -> seed admin -> update status
- Two JWT types: global (type:"global") and tenant (type:"tenant" with tenantId/tenantSlug)
- bcrypt for password hashing; class-validator + class-transformer for DTO validation

## Requirements
**Functional:** Global admin login. Create/read/update/delete tenants. Manage plans + subscriptions. Feature toggles. Billing overview. Tenant provisioning creates DB automatically.
**Non-functional:** Stateless JWT auth. Guard chain enforced on all protected routes. Prisma client pooling. DTO validation on all inputs.

## Architecture
See Architecture doc sections 5-7. Guard chain on every request. Route prefixes: `/auth/*` (public), `/global/*` (GLOBAL_ADMIN), `/tenant/*` (tenant users). JWT payloads carry role + type + optional tenantId.

## Related Code Files

**Files to create:**
```
# Auth module
apps/api/src/auth/auth.module.ts
apps/api/src/auth/auth.controller.ts
apps/api/src/auth/auth.service.ts
apps/api/src/auth/strategies/jwt.strategy.ts
apps/api/src/auth/guards/jwt-auth.guard.ts
apps/api/src/auth/guards/roles.guard.ts
apps/api/src/auth/guards/tenant-context.guard.ts
apps/api/src/auth/decorators/roles.decorator.ts
apps/api/src/auth/decorators/current-user.decorator.ts
apps/api/src/auth/dto/global-login.dto.ts
apps/api/src/auth/dto/tenant-login.dto.ts

# Database module (NestJS wrapper)
apps/api/src/database/database.module.ts
apps/api/src/database/global-prisma.service.ts

# Tenants module
apps/api/src/tenants/tenants.module.ts
apps/api/src/tenants/tenants.controller.ts
apps/api/src/tenants/tenants.service.ts
apps/api/src/tenants/dto/create-tenant.dto.ts
apps/api/src/tenants/dto/update-tenant.dto.ts
apps/api/src/tenants/tenant-provisioner.service.ts

# Plans module
apps/api/src/plans/plans.module.ts
apps/api/src/plans/plans.controller.ts
apps/api/src/plans/plans.service.ts
apps/api/src/plans/dto/create-plan.dto.ts

# Subscriptions module
apps/api/src/subscriptions/subscriptions.module.ts
apps/api/src/subscriptions/subscriptions.controller.ts
apps/api/src/subscriptions/subscriptions.service.ts
apps/api/src/subscriptions/dto/create-subscription.dto.ts
apps/api/src/subscriptions/dto/update-subscription.dto.ts

# Features module
apps/api/src/features/features.module.ts
apps/api/src/features/features.controller.ts
apps/api/src/features/features.service.ts
apps/api/src/features/dto/create-feature.dto.ts
apps/api/src/features/dto/toggle-feature.dto.ts

# Billing module
apps/api/src/billing/billing.module.ts
apps/api/src/billing/billing.controller.ts
apps/api/src/billing/billing.service.ts
```

## Implementation Steps

**1. Install auth dependencies**
```bash
cd apps/api
pnpm add @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt class-validator class-transformer
pnpm add -D @types/passport-jwt @types/bcrypt
```

**2. Create DatabaseModule** -- Wrap global PrismaClient as NestJS provider. Export `GlobalPrismaService` extending PrismaClient with `onModuleInit()` connect and `onModuleDestroy()` disconnect. Register as global module.

**3. Create JWT Strategy** -- `JwtStrategy` extends PassportStrategy(Strategy). Validate extracts `sub`, `email`, `role`, `type`, `tenantId`, `tenantSlug` from payload. Secret from `JWT_SECRET` env var.

**4. Create JwtAuthGuard** -- Extends `AuthGuard('jwt')`. Returns 401 on invalid/missing token.

**5. Create RolesGuard** -- CanActivate guard. Reads `@Roles()` decorator metadata. Compares `request.user.role` against allowed roles. Returns 403 on mismatch.

**6. Create TenantContextGuard** -- CanActivate guard. Only activates for tenant-type tokens. Reads `tenantId` from JWT. Looks up tenant in global DB for `databaseUrl`. Calls `TenantPrismaManager.getClient(tenantId, databaseUrl)`. Attaches result to `request.tenantPrisma`. Returns 403 if tenant not found or inactive.

**7. Create AuthModule + AuthController + AuthService**

Endpoints:
- `POST /auth/global/login` -- Validate email/password against GlobalUser. Return JWT with `{sub, email, role:"GLOBAL_ADMIN", type:"global"}`.
- `POST /auth/tenant/login` -- Accept `{email, password, tenantSlug}`. Lookup tenant by slug in global DB. Get tenant DB client. Validate against TenantUser. Return JWT with `{sub, email, role, type:"tenant", tenantId, tenantSlug}`.

Password hashing: bcrypt with salt rounds 10.

**8. Create TenantProvisionerService**

Flow (see Architecture section 7):
1. Insert tenant into global DB with `status: PROVISIONING`
2. Execute raw SQL: `CREATE DATABASE saas_tenant_{slug}`
3. Run `prisma migrate deploy --schema=packages/database/prisma/tenant/schema.prisma` with overridden DATABASE_URL
4. Seed default TenantUser with role TENANT_ADMIN (email from input, bcrypt-hashed password)
5. Update tenant: `status: ACTIVE`, store `databaseUrl`
6. Create subscription linking tenant to selected plan

Rollback: If any step fails, update tenant status to `FAILED`, drop DB if created.

**9. Create TenantsModule** -- CRUD for tenants:
- `GET /global/tenants` -- List all tenants (with pagination)
- `POST /global/tenants` -- Create + provision via TenantProvisionerService
- `GET /global/tenants/:id` -- Detail with subscription info
- `PATCH /global/tenants/:id` -- Update name/settings
- `DELETE /global/tenants/:id` -- Suspend (set status SUSPENDED)

Guards: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('GLOBAL_ADMIN')`

**10. Create PlansModule**
- `GET /global/plans` -- List plans
- `POST /global/plans` -- Create plan (name, price, maxProducts, maxUsers)

**11. Create SubscriptionsModule**
- `POST /global/subscriptions` -- Assign plan to tenant
- `PATCH /global/subscriptions/:id` -- Update subscription
- `PATCH /global/subscriptions/:id/rental-fee` -- Set rental fee

**12. Create FeaturesModule**
- `GET /global/features` -- List features
- `POST /global/features` -- Create feature flag
- `POST /global/tenants/:id/features` -- Toggle feature for tenant

**13. Create BillingModule**
- `GET /global/billing` -- Billing overview (aggregate billing records)

**14. Wire up AppModule** -- Import all modules. Register global validation pipe with `class-validator`. Register TenantPrismaManager as provider.

**15. Seed global admin** -- Create seed script: insert GlobalUser with `GLOBAL_ADMIN` role using env vars for email/password.

## Todo List
- [ ] Install auth/validation dependencies
- [ ] Create DatabaseModule with GlobalPrismaService
- [ ] Create JWT strategy + JwtAuthGuard
- [ ] Create RolesGuard + @Roles decorator
- [ ] Create TenantContextGuard
- [ ] Create AuthModule (global login + tenant login)
- [ ] Create TenantProvisionerService
- [ ] Create TenantsModule (5 endpoints)
- [ ] Create PlansModule (2 endpoints)
- [ ] Create SubscriptionsModule (3 endpoints)
- [ ] Create FeaturesModule (3 endpoints)
- [ ] Create BillingModule (1 endpoint)
- [ ] Wire AppModule, global validation pipe
- [ ] Create global admin seed script
- [ ] Test: global login returns valid JWT
- [ ] Test: tenant provisioning creates DB + seeds admin

## Success Criteria
- Global admin can login and receive JWT
- All 15 global admin endpoints respond correctly
- Tenant provisioning creates isolated database, runs migrations, seeds admin
- Guard chain enforces role-based access (401/403 on unauthorized)
- DTOs reject invalid input with descriptive errors
- TenantPrismaManager caches connections + evicts idle

## Risk Assessment
| Risk | Mitigation |
|------|-----------|
| Provisioning fails mid-flow | Status tracking + rollback (drop DB, revert tenant status) |
| PrismaClient memory leak | LRU eviction at 10 min idle, connection_limit=5 |
| JWT secret exposure | Load from env, never hardcode, rotate periodically |
| Raw SQL injection in CREATE DATABASE | Sanitize slug (alphanumeric + underscore only) |

## Security Considerations
- bcrypt with 10 salt rounds for all passwords
- JWT secret from environment variable only
- Slug sanitization before DB creation (regex: `/^[a-z0-9_-]+$/`)
- Guard chain enforced on every protected endpoint
- TenantContextGuard verifies tenant is ACTIVE before granting access
- class-validator whitelist: strip unknown properties from DTOs

## Next Steps
- Proceed to [Phase 3: Tenant API](./phase-03-tenant-api.md) for tenant-scoped CRUD modules
