# Phase 6: Polish

## Context Links
- **Parent Plan:** [plan.md](./plan.md)
- **Architecture:** [system-architecture.md](../../docs/system-architecture.md) -- sections 10, 11
- **Depends on:** [Phase 2](./phase-02-api-core.md), [Phase 3](./phase-03-tenant-api.md), [Phase 4](./phase-04-global-admin-frontend.md), [Phase 5](./phase-05-tenant-admin-frontend.md)

## Overview
- **Date:** 2026-02-12
- **Priority:** P2
- **Effort:** 4h
- **Description:** Production hardening -- global exception filter, pagination/filtering/sorting on all list endpoints, audit logging middleware, comprehensive tests (unit + integration + E2E), Swagger API docs, deployment prep (Dockerfile, CI/CD outline).
- **Implementation Status:** Pending
- **Review Status:** Not started

## Key Insights
- NestJS ExceptionFilter provides consistent error response format across all endpoints
- Pagination via query params (page, limit, search, sortBy, sortOrder) on all list endpoints
- AuditLog table in global DB tracks all admin actions (userId, action, resource, details)
- @nestjs/swagger auto-generates OpenAPI docs from controllers + DTOs
- Deployment: node:24-alpine Docker image; multi-stage build for minimal image size

## Requirements
**Functional:** Consistent error responses. Paginated list endpoints. Audit trail for admin actions. API documentation. Test coverage for critical paths.
**Non-functional:** All errors return `{ statusCode, message, error }` format. Pagination metadata in response. Swagger UI at `/api/docs`. Docker image under 200MB. >80% test coverage on services/guards.

## Architecture
Error handling: global HttpExceptionFilter catches all exceptions, normalizes response. Pagination: query DTO with page/limit/search/sortBy/sortOrder; response includes `{ data, meta: { total, page, limit, totalPages } }`. Audit: NestJS interceptor logs to AuditLog table after successful mutations.

## Related Code Files

**Files to create:**
```
# Error handling
apps/api/src/common/filters/http-exception.filter.ts
apps/api/src/common/filters/all-exceptions.filter.ts

# Pagination
apps/api/src/common/dto/pagination-query.dto.ts
apps/api/src/common/interfaces/paginated-response.interface.ts
apps/api/src/common/utils/paginate.ts

# Audit logging
apps/api/src/common/interceptors/audit-log.interceptor.ts
apps/api/src/common/decorators/audit-action.decorator.ts

# Swagger setup
apps/api/src/swagger.ts

# Unit tests
apps/api/src/auth/auth.service.spec.ts
apps/api/src/auth/guards/jwt-auth.guard.spec.ts
apps/api/src/auth/guards/roles.guard.spec.ts
apps/api/src/auth/guards/tenant-context.guard.spec.ts
apps/api/src/tenants/tenants.service.spec.ts
apps/api/src/tenants/tenant-provisioner.service.spec.ts
apps/api/src/tenant/products/products.service.spec.ts
apps/api/src/tenant/orders/orders.service.spec.ts

# Integration tests
apps/api/test/auth.e2e-spec.ts
apps/api/test/tenants.e2e-spec.ts
apps/api/test/tenant-products.e2e-spec.ts

# E2E tests
apps/api/test/provisioning.e2e-spec.ts

# Deployment
apps/api/Dockerfile
apps/api/.dockerignore
.github/workflows/ci.yml
```

## Implementation Steps

**1. Create HttpExceptionFilter** -- Global filter catches HttpException + unhandled errors. Returns consistent `{ statusCode, message, error, timestamp, path }`. Register in main.ts via `app.useGlobalFilters()`.

**2. Create pagination utilities**

PaginationQueryDto: `page` (int, min 1, default 1), `limit` (int, min 1, max 100, default 10), `search` (string, optional), `sortBy` (string, optional), `sortOrder` (enum asc/desc, default asc).

`paginate()` helper: accepts Prisma model + query params + optional where/include. Returns `{ data: T[], meta: { total, page, limit, totalPages } }`.

Update all list endpoints to use PaginationQueryDto.

**3. Create AuditLogInterceptor** -- NestJS interceptor; triggers after successful POST/PATCH/DELETE. Reads `@AuditAction()` decorator metadata. Logs to global AuditLog table: userId, action, resource, details, timestamp.

**4. Set up Swagger** -- Install `@nestjs/swagger`. Configure DocumentBuilder in main.ts. Add `@ApiTags`, `@ApiOperation`, `@ApiResponse` to controllers; `@ApiProperty` to DTOs. UI at `/api/docs`.

**5. Unit tests** -- Jest with mocked PrismaClient. Targets: AuthService (login, tokens), guards (JwtAuth, Roles, TenantContext), TenantsService (CRUD), ProductsService (CRUD), OrdersService (create with items).

**6. Integration tests** -- `@nestjs/testing` + supertest with test DB. Flows: auth login -> token -> protected route; tenant CRUD; product CRUD.

**7. E2E provisioning test** -- Full flow: global login -> create tenant -> verify DB -> tenant login -> create product -> verify isolation.

**8. Dockerfile** -- Multi-stage build. Stage 1: node:24-alpine builder (install deps, build). Stage 2: node:24-alpine production (copy dist + node_modules, expose 3001).

**9. .dockerignore** -- Exclude node_modules, .git, docs, plans, .env, *.md, coverage, .next.

**10. CI/CD** -- `.github/workflows/ci.yml`: trigger on push/PR, checkout, node 24, pnpm install, lint, build, test. PostgreSQL service container.

## Todo List
- [ ] Create HttpExceptionFilter (global)
- [ ] Create PaginationQueryDto + paginate() helper
- [ ] Update all list endpoints with pagination
- [ ] Create AuditLogInterceptor + @AuditAction decorator
- [ ] Set up Swagger documentation
- [ ] Add Swagger decorators to all controllers + DTOs
- [ ] Write unit tests for services + guards
- [ ] Write integration tests for auth + CRUD flows
- [ ] Write E2E test for tenant provisioning
- [ ] Create Dockerfile (multi-stage, node:24-alpine)
- [ ] Create .dockerignore
- [ ] Create CI/CD workflow outline

## Success Criteria
- All errors return consistent JSON format
- List endpoints accept pagination params; response includes meta
- Audit log records admin mutations
- Swagger UI accessible at `/api/docs`
- Unit tests pass with >80% coverage
- Integration + E2E tests verify full flows
- Docker image builds under 200MB

## Risk Assessment
| Risk | Mitigation |
|------|-----------|
| Audit logging latency | Async DB write in interceptor |
| Pagination on large datasets | DB indexes on sortable columns |
| Test DB conflicts | Unique DB per suite; afterAll cleanup |
| Docker cache invalidation | COPY order: lockfile -> deps -> source |

## Security Considerations
- Exception filter hides stack traces in production
- Swagger UI disabled in production (env flag)
- Audit log for non-repudiation
- CI/CD secrets in GitHub Actions secrets
- Docker runs as non-root user

## Next Steps
- Project ready for initial deployment
- Future: PgBouncer, CDN, rate limiting, email notifications, webhooks
