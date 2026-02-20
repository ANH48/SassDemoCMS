# Backend Stack: Latest Versions & Setup Patterns (Feb 2026)

## Executive Summary
Research findings on latest stable backend stack components for SaaS multi-tenant ecommerce project. All versions as of February 2026.

---

## 1. NestJS

**Latest Stable Version:** 11.1.13 (CLI: 11.0.16)

**Key Features in v11:**
- Opaque key generation overhaul using object references (startup performance boost)
- Built-in monorepo workspace management via CLI
- Schematics collection: `@nestjs/schematics`

**Monorepo Setup Pattern:**
```bash
nest new my-workspace --skip-git
nest generate library @org/database
nest generate app api
```

**Project Structure:**
```
workspace/
├── apps/
│   ├── api/
│   └── admin/
├── libs/
│   ├── database/
│   ├── common/
│   └── auth/
└── nest-cli.json
```

---

## 2. Prisma ORM

**Latest Stable Version:** 7.2.0+

**Multi-Schema Setup (PostgreSQL):**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["base", "tenant"]
}

model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  @@schema("base")
}

model TenantData {
  id    Int     @id @default(autoincrement())
  data  Json
  @@schema("tenant")
}
```

**Multi-File Schema Support:** Available since v5.15.0
**CLI Commands:**
```bash
npx prisma db push --skip-generate  # Push multiple schemas
npx prisma generate                  # Generate client
npx prisma migrate dev --name init   # Create migrations
```

**Schema Constraints:** Multi-schema only supported on PostgreSQL, CockroachDB, SQL Server.

---

## 3. Turborepo

**Latest Stable Version:** 2.8.6

**Key Features (v2.7+):**
- Devtools with visual Package and Task graphs
- Composable package configurations
- Support for `turbo.jsonc` format
- Sidecar tasks for complex pipelines
- Bun pruning support

**turbo.json v2 Configuration Pattern:**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "version": 2,
  "tasks": {
    "build": {
      "outputs": ["dist/**"],
      "cache": true,
      "dependsOn": ["^build"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "outputs": ["coverage/**"],
      "dependsOn": ["build"]
    }
  },
  "pipeline": {
    "api#build": {
      "outputs": ["dist/**"],
      "dependsOn": ["^build"]
    },
    "web#build": {
      "outputs": [".next/**"],
      "dependsOn": ["^build"]
    }
  }
}
```

**Code Migration:** `npx @turbo/codemod migrate`

---

## 4. pnpm

**Latest Stable Version:** 9.x (9.4.0+)

**Workspace Configuration (pnpm-workspace.yaml):**
```yaml
packages:
  - "apps/*"
  - "libs/*"
  - "packages/*"

catalog:
  dependencies:
    typescript: "5.3.3"
    nestjs: "11.0.0"
    prisma: "7.2.0"

overrides:
  "**/@types/node": "20.10.0"
```

**Key Features:**
- `workspace:` protocol for local dependencies
- Catalog for centralized version management
- Shared lockfile (pnpm-lock.yaml)
- Efficient node_modules linking

**Installation:** `npm install -g pnpm@9`

---

## 5. Docker Compose - PostgreSQL 17

**Recommended docker-compose.yml:**
```yaml
version: '3.9'
services:
  postgres:
    image: postgres:17-alpine
    container_name: postgres-dev
    restart: always
    environment:
      POSTGRES_USER: dev_user
      POSTGRES_PASSWORD: dev_password
      POSTGRES_DB: ecommerce_dev
      POSTGRES_INITDB_ARGS: "--encoding=UTF8"
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

**Critical Notes:**
- Mount at `/var/lib/postgresql/data` (not `/var/lib/postgresql`)
- Use specific version tag (`17-alpine` recommended for smaller image)
- Always set `POSTGRES_PASSWORD` (required)
- Include health check for container readiness
- Use `restart: always` for persistent availability

---

## Key Integration Points

**pnpm + Turborepo:**
```json
// turbo.json
{
  "globalDependencies": ["pnpm-workspace.yaml", ".npmrc"]
}
```

**Turborepo + NestJS + Next.js Pipeline:**
```json
{
  "api#dev": {
    "cache": false,
    "persistent": true,
    "inputs": ["src/**"]
  },
  "web#dev": {
    "cache": false,
    "persistent": true
  }
}
```

---

## Version Compatibility Matrix

| Package | Version | Node.js | Notes |
|---------|---------|---------|-------|
| NestJS | 11.1.13 | 18+ | Major performance improvements |
| Prisma | 7.2.0+ | 16+ | Multi-schema production-ready |
| Turborepo | 2.8.6 | 18+ | Latest with full v2 features |
| pnpm | 9.4.0+ | 14.19+ | Latest stable workspace support |
| PostgreSQL | 17 | - | Latest production stable |

---

## Unresolved Questions

1. Specific Turborepo configuration for dual-schema Prisma generation workflows
2. pnpm version resolution strategy for monorepo with 20+ packages
3. Performance benchmarks for multi-tenant schema isolation in PostgreSQL 17

---

**Research Date:** February 12, 2026
**Sources:** Official documentation, GitHub releases, npm registry, Docker Hub

