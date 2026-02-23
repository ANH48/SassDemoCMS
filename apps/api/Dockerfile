# ── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:24-alpine AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace manifests
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/database/package.json  ./packages/database/
COPY packages/types/package.json     ./packages/types/
COPY packages/config/package.json    ./packages/config/
COPY apps/api/package.json           ./apps/api/

# Install all deps (including devDeps for build)
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Generate Prisma clients
RUN pnpm --filter @repo/database exec prisma generate --schema=prisma/global/schema.prisma
RUN pnpm --filter @repo/database exec prisma generate --schema=prisma/tenant/schema.prisma

# Build NestJS app
RUN pnpm --filter @repo/api build

# ── Stage 2: Production ────────────────────────────────────────────────────────
FROM node:24-alpine AS production
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace manifests
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/database/package.json  ./packages/database/
COPY packages/types/package.json     ./packages/types/
COPY packages/config/package.json    ./packages/config/
COPY apps/api/package.json           ./apps/api/

# Install production deps only
RUN pnpm install --frozen-lockfile --prod

# Copy built output + generated Prisma clients
COPY --from=builder /app/apps/api/dist         ./apps/api/dist
COPY --from=builder /app/packages/database/src/generated ./packages/database/src/generated

# Run as non-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3001
ENV NODE_ENV=production

CMD ["node", "apps/api/dist/main"]
