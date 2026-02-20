---
title: "SaaS Multi-Tenant E-Commerce Platform"
description: "Multi-tenant SaaS CMS with separate PostgreSQL databases per tenant, global admin, and tenant admin portals"
status: pending
priority: P1
effort: 55h
branch: main
tags: [saas, multi-tenant, ecommerce, nestjs, nextjs, prisma]
created: 2026-02-12
---

# SaaS Multi-Tenant E-Commerce Platform - Implementation Plan

## Overview

Build a multi-tenant SaaS CMS platform with complete tenant data isolation using separate PostgreSQL databases. Global admin manages tenants/billing/subscriptions. Tenant admin manages products (unified CMS Billing with KiotViet-style POS features: multiple price tiers, product types, categories, commission rates, service packages)/orders/revenue.

## Version Matrix

| Package | Version | Notes |
|---------|---------|-------|
| Node.js | 24+ LTS | Until April 2028 |
| NestJS | 11.1.13 | CLI 11.0.16 |
| Prisma ORM | 7.2.0+ | Multi-schema ready |
| Next.js | 16.1.6 | Turbopack stable |
| React | 19.2.4 | Server Components |
| shadcn/ui | Feb 2026 | Unified radix-ui |
| Tailwind CSS | v4.1 | CSS-first config |
| Turborepo | 2.8.6 | v2 config |
| pnpm | 9.4.0+ | Workspace protocol |
| PostgreSQL | 17-alpine | Docker |
| TypeScript | 5.7+ | Strict mode |
| BullMQ | latest | Async job queue |
| Redis | 7-alpine | Queue backend (Docker) |

## Phases

| Phase | Description | Priority | Effort | Status |
|-------|-------------|----------|--------|--------|
| [Phase 1](./phase-01-foundation.md) | Foundation: monorepo, packages, docker+redis, prisma | P1 | 10h | Pending |
| [Phase 2](./phase-02-api-core.md) | API Core: auth, guards, async provisioning, global modules | P1 | 12h | Pending |
| [Phase 3](./phase-03-tenant-api.md) | Tenant API (CMS Billing): product categories, products (unified with services/materials/packages), orders, customers | P1 | 10h | Pending |
| [Phase 4](./phase-04-global-admin-frontend.md) | Global Admin Frontend: dashboard, tenant mgmt, custom domains | P2 | 8h | Pending |
| [Phase 5](./phase-05-tenant-admin-frontend.md) | Tenant Admin Frontend: CMS Billing UI, product categories, enhanced product CRUD, custom domain routing | P2 | 8h | Pending |
| [Phase 6](./phase-06-polish.md) | Polish: error handling, pagination, rate limiting, tests, docs | P2 | 8h | Pending |

## Key Dependencies

- Node.js 24+ (LTS until April 2028)
- pnpm 9+ (workspace protocol)
- Docker (PostgreSQL 17-alpine + Redis 7-alpine)
- Turborepo 2.8.6 (v2 config)
- BullMQ + Redis (async job queue)

## Key Documents

- [System Architecture](../../docs/system-architecture.md)
- [Architecture Brainstorm](./reports/architecture-brainstorm-report.md)
- [Node.js 24 Decision](./reports/brainstorm-nodejs-24-lts-upgrade-decision-and-compatibility-matrix.md)
- [Backend Research](./research/backend-stack-latest-versions-setup-patterns-feb-2026.md)
- [Frontend Research](./research/researcher-frontend-stack-versions-and-patterns.md)

## Architecture Summary

```
apps/global-admin (Next.js 16, :3000) --> apps/api (NestJS 11, :3001) --> PostgreSQL 17
apps/tenant-admin (Next.js 16, :3002) --> apps/api (NestJS 11, :3001) --> Tenant DBs

packages/ui        - shadcn/ui shared components
packages/types     - Shared TypeScript types
packages/config    - ESLint + TSConfig presets
packages/database  - Prisma schemas + connection manager
packages/lib       - Shared auth, API client, middleware utils
```

## Validation Summary

**Validated:** 2026-02-12
**Questions asked:** 8

### Confirmed Decisions
1. **Async provisioning with BullMQ + Redis** -- Tenant DB creation runs as background job. API returns 202 Accepted. Requires Redis in docker-compose.
2. **Two frontend apps + shared packages/lib** -- Keep global-admin and tenant-admin separate. Extract api-client.ts, auth.ts, middleware.ts into packages/lib.
3. **Tests per phase** -- Write unit tests alongside each phase. Phase 6 focuses on integration/E2E tests, rate limiting, and polish only.
4. **Custom domain support** -- Full custom domain routing for tenants (wildcard DNS + domain verification + SSL). Significant effort increase.
5. **Slug login for MVP** -- Start with slug-based login as immediate implementation. Custom domains layer on top.
6. **Rate limiting in Phase 6** -- Add @nestjs/throttler with basic per-IP/token limits.

### Action Items (Plan Revisions Needed)
- [ ] **Phase 1**: Add Redis 7-alpine to docker-compose. Add packages/lib to monorepo structure (5 packages total).
- [ ] **Phase 2**: Replace sync provisioning with BullMQ async job. Add @nestjs/bullmq + ioredis deps. API returns 202 + polling endpoint for status. Add unit tests for auth + guards.
- [ ] **Phase 3**: Add unit tests for each tenant service.
- [ ] **Phase 4**: Add custom domain management UI for global admin (domain verification, DNS instructions). Add unit tests for components.
- [ ] **Phase 5**: Add custom domain middleware routing (resolve tenant from Host header). Fallback to slug login. Add unit tests.
- [ ] **Phase 6**: Add @nestjs/throttler rate limiting. Integration/E2E tests only (unit tests done in prior phases). Effort increased due to custom domain E2E testing.
- [ ] **Architecture doc**: Update to reflect Redis, packages/lib, async provisioning, custom domains.

## Risk Summary

| Risk | Mitigation |
|------|-----------|
| DB sprawl with many tenants | PgBouncer + connection_limit=5 + LRU eviction |
| Schema drift across tenant DBs | Single migration source, automated deploy |
| Provisioning failure | Status tracking, rollback on failure |
| JWT secret compromise | Rotate secrets, short expiry, refresh tokens |
