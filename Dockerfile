# ─────────────────────────────────────────────
# Storefront Suradai (Next.js) — Multi-stage standalone build
# ─────────────────────────────────────────────

# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/database/package.json packages/database/
COPY packages/core/package.json packages/core/
COPY packages/logger/package.json packages/logger/
COPY packages/mcp-server/package.json packages/mcp-server/
COPY apps/storefront-suradai/package.json apps/storefront-suradai/

RUN pnpm install --frozen-lockfile

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=deps /app/packages/core/node_modules ./packages/core/node_modules
COPY --from=deps /app/packages/logger/node_modules ./packages/logger/node_modules
COPY --from=deps /app/apps/storefront-suradai/node_modules ./apps/storefront-suradai/node_modules

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json tsconfig.base.json ./
COPY packages/ packages/
COPY apps/storefront-suradai/ apps/storefront-suradai/

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# next build prerenders DB-backed pages; DATABASE_URL injected via build args
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
# basePath is baked into both client bundle and standalone server at build time
ARG NEXT_PUBLIC_BASE_PATH
ENV NEXT_PUBLIC_BASE_PATH=${NEXT_PUBLIC_BASE_PATH}

# Build workspace deps (core, database, logger dists) then the app
RUN pnpm -r --filter "@platform-os/storefront-suradai..." run build

# Stage 3: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/storefront-suradai/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/storefront-suradai/.next/static ./apps/storefront-suradai/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/storefront-suradai/public ./apps/storefront-suradai/public

USER nextjs
EXPOSE 3001

CMD ["node", "apps/storefront-suradai/server.js"]
