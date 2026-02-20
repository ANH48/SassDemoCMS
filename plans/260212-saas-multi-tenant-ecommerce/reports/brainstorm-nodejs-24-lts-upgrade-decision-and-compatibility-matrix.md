# Brainstorm Report: Node.js 24+ Upgrade

**Date:** 2026-02-12
**Status:** Approved
**Decision:** Upgrade minimum Node.js from 20+ to 24+

---

## Problem Statement

Current plan specifies Node.js 20+ as minimum. Node.js 20 entered maintenance mode (critical security patches only), with EOL April 2026 (~14 months away). Starting new project on maintenance-only runtime creates unnecessary timeline pressure.

## Requirements

- Longest possible LTS support window for new project
- Zero migration friction (pre-implementation phase)
- Full compatibility with existing tech stack decisions

## Evaluated Approaches

### Option A: Keep Node.js 20+ (Rejected)

**Pros:**
- Wider developer compatibility (more devs have Node 20 installed)
- More third-party packages tested against it

**Cons:**
- EOL April 2026 - only 14 months remaining
- Maintenance mode - no new features, only critical patches
- Will force mid-project upgrade during development or early production
- Miss V8 13.6 performance gains

### Option B: Node.js 22+ (Rejected)

**Pros:**
- Active LTS until October 2027
- Good middle ground

**Cons:**
- Still shorter support than Node.js 24
- Misses V8 13.6 and npm 11 improvements
- No meaningful advantage over Node.js 24 for greenfield project

### Option C: Node.js 24+ (Selected)

**Pros:**
- Active LTS until October 2026, maintenance until April 2028
- V8 13.6 engine: 15-20% perf improvement on data-heavy workloads
- Native .env loading (can drop dotenv dependency)
- npm 11: 65% faster installs
- Native TypeScript type stripping for scripts/tooling
- Permission model for security sandboxing
- All frameworks confirmed compatible (NestJS 11+, Prisma 7+, Next.js 16, pnpm 9+, Turborepo)

**Cons:**
- Slightly narrower developer compatibility (devs need to install Node 24)
- Negligible: just `nvm install 24`

## Final Decision

**Node.js 24+** selected. Zero migration cost (no code exists). 3-year LTS window. All stack components confirmed compatible. Performance and DX bonuses included at no cost.

## Compatibility Matrix

| Package | Version | Node.js 24 Support |
|---------|---------|-------------------|
| NestJS | 11.x | Fully compatible |
| Prisma ORM | 7.0.0+ | Officially supported |
| Next.js | 16.x | Fully compatible |
| pnpm | 9.x+ | Compatible |
| Turborepo | Latest | Compatible |

## Implementation Considerations

- Update `plan.md` key dependencies: Node.js 20+ → 24+
- Docker images: `node:24-alpine`
- CI/CD: `node-version: '24'`
- `.nvmrc`: `24`
- `package.json` engines: `"node": ">=24.0.0"`

## Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Developer env setup | Low | Low | Document in README, provide .nvmrc |
| Third-party pkg compat | Very Low | Low | All major deps confirmed compatible |

## Success Criteria

- All plan docs reflect Node.js 24+ requirement
- Phase 1 foundation setup uses node:24-alpine Docker image
- Development environment documented with Node.js 24 instructions

## Next Steps

- [x] Update plan.md key dependencies
- [x] Update system-architecture.md if needed
- [ ] Phase 1 implementation uses Node.js 24+ throughout
