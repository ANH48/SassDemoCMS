# SaaS Multi-Tenant E-Commerce Platform - Changelog

All notable changes to the SaaS Multi-Tenant E-Commerce Platform will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Planned
- Phase 1: Foundation (monorepo, Docker, Prisma, packages)
- Phase 2: API Core (auth, guards, async provisioning, global admin endpoints)
- Phase 3: Tenant API - CMS Billing (product categories, unified products, orders, customers)
- Phase 4: Global Admin Frontend
- Phase 5: Tenant Admin Frontend (CMS Billing UI)
- Phase 6: Polish, rate limiting, comprehensive testing

---

## [0.1.1-planning] - 2026-02-13

### Changed
- **CMS Billing Enhancement**: Enhanced tenant Product model to match KiotViet-style POS billing system
- **Unified Product Model**: Merged separate Service model into Product with `ProductType` enum (GOODS, SERVICE_PACKAGE, MATERIAL_TRACKED, RAW_MATERIAL, SERVICE)
- **Multi-Tier Pricing**: Product now supports 4 selling price tiers + import price + cost price
- **Product Categories**: Added hierarchical ProductCategory model with self-referential parent/child
- **Service Packages**: Added PackageItem model for SERVICE_PACKAGE products containing sub-items
- **Commission Rates**: Added 3 staff commission rate levels per product
- **Enhanced OrderItem**: Added priceTier (1-4), discount, staffId for commission tracking; removed polymorphic serviceId
- **Inventory-Aware Orders**: Stock only decrements for inventory-tracked product types (GOODS, MATERIAL_TRACKED, RAW_MATERIAL)
- **Phase 3 effort increased**: 8h -> 10h due to enhanced CMS Billing complexity

### Removed
- **Service model**: Replaced by Product with `productType = SERVICE`
- **ServicesModule**: Replaced by ProductCategoriesModule in Phase 3

### Added
- **ProductCategoriesModule**: New tenant API module for hierarchical product grouping
- **Product Type Behavior Utility**: Application-layer utility mapping ProductType -> {hasInventory, canSell, canBuy}
- **Product query filtering**: Search by name/SKU, categoryId, productType, status
- **Package items endpoints**: CRUD for sub-items within SERVICE_PACKAGE products

---

## [0.1.0-planning] - 2026-02-12

### Added
- **Architecture Design Complete**: Multi-tenant SaaS CMS with separate PostgreSQL databases per tenant
- **Tech Stack Finalized**: Node.js 24+ LTS, NestJS 11.1.13, Next.js 16.1.6, React 19.2.4, Prisma 7.2.0+
- **6 Implementation Phases Designed**: 55 hours total effort
- **Validation Decisions Confirmed**:
  - Async provisioning with BullMQ + Redis 7-alpine
  - 5 packages in monorepo (added packages/lib for shared utilities)
  - Unit tests written per phase (not deferred)
  - Full custom domain support (wildcard DNS + verification + SSL)
  - Slug-based login as MVP, custom domains layer on top
  - Rate limiting via @nestjs/throttler in Phase 6

### Documentation
- System Architecture: Complete multi-tenant design patterns, async provisioning, custom domains
- Codebase Structure & Coding Standards: NestJS, Next.js, React patterns, file organization
- Project Development Roadmap: Phase-by-phase breakdown with milestones and effort estimates
- SaaS E-Commerce Platform Changelog: This file (living document)

### Version Matrix
- Node.js: 24+ LTS (Until April 2028)
- NestJS: 11.1.13
- Next.js: 16.1.6
- React: 19.2.4
- Prisma: 7.2.0+
- PostgreSQL: 17-alpine
- Redis: 7-alpine (for BullMQ job queue)
- TypeScript: 5.7+ (strict mode)
- Turborepo: 2.8.6 (v2 config)
- pnpm: 9.4.0+

### Implementation Status
- Phase 1: Pending (Foundation setup)
- Phase 2: Pending (API Core with async provisioning)
- Phase 3: Pending (Tenant API)
- Phase 4: Pending (Global Admin Frontend)
- Phase 5: Pending (Tenant Admin Frontend)
- Phase 6: Pending (Polish & QA)

---

## Change Categories Reference

### Added
New features, capabilities, components, or design decisions

### Changed
Modifications to existing architecture, decisions, or implementations

### Deprecated
Features planned for removal in future versions

### Removed
Features that have been deleted or sunset

### Fixed
Bug fixes and issue resolutions

### Security
Security vulnerabilities patched or security improvements implemented

---

## Future Changelog Entry Template

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- Brief description of new feature or component
- Another new addition

### Changed
- What changed in existing functionality and why
- Another change made

### Deprecated
- Feature marked for future removal
- Another deprecation

### Removed
- Feature that was deleted
- Another removal

### Fixed
- Bug fix description
- Another fix

### Security
- Security vulnerability or improvement
- Another security-related change
```

---

## Documentation Updates

| Version | Documentation Updates | Date |
|---------|----------------------|------|
| 0.1.1-planning | CMS Billing Enhancement, Unified Product Model | 2026-02-13 |
| 0.1.0-planning | Architecture, Roadmap, Code Standards | 2026-02-12 |

---

## Notes for Contributors

When updating this changelog:
- Use present tense for consistency: "Add feature X" not "Added feature X"
- Group changes by category (Added, Changed, Fixed, etc.)
- Include issue/ticket numbers in square brackets if applicable
- Keep version numbers aligned with semantic versioning (MAJOR.MINOR.PATCH)
- Link to pull requests or commits where helpful
- Document breaking changes prominently

Example commit message:
```
feat(provisioning): add async job queue with BullMQ [#123]
```

---

## Roadmap Alignment

Current implementation phase status:

| Phase | Title | Status | Estimated Start | Target Duration |
|-------|-------|--------|-----------------|-----------------|
| 1 | Foundation | Pending | TBD | 10h |
| 2 | API Core | Pending | TBD | 12h |
| 3 | Tenant API (CMS Billing) | Pending | TBD | 10h |
| 4 | Global Admin Frontend | Pending | TBD | 8h |
| 5 | Tenant Admin Frontend | Pending | TBD | 8h |
| 6 | Polish & QA | Pending | TBD | 8h |

**Total Project Effort:** 56 hours

See [Project Development Roadmap](./project-development-roadmap.md) for detailed phase planning, milestones, and risk assessments.

---

## Reference Links

- [System Architecture](./system-architecture.md)
- [Codebase Structure & Coding Standards](./codebase-structure-and-coding-standards.md)
- [Project Development Roadmap](./project-development-roadmap.md)
- [Phase 1: Foundation Plan](../plans/260212-saas-multi-tenant-ecommerce/phase-01-foundation.md)
- [Phase 2: API Core Plan](../plans/260212-saas-multi-tenant-ecommerce/phase-02-api-core.md)
