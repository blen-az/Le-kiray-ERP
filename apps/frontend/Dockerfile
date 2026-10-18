# Multi-stage Dockerfile for Next.js Standalone Frontend App
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./
COPY apps/frontend/package*.json ./apps/frontend/
COPY apps/backend/package*.json ./apps/backend/

# Install dependencies
RUN npm ci

# Copy frontend source and build standalone output
COPY apps/frontend ./apps/frontend
WORKDIR /app/apps/frontend
ENV NEXT_TELEMETRY_DISABLED=1
# Browser-visible config must be present at build time (Next.js inlines NEXT_PUBLIC_*)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_USE_MOCK_DATA=false
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_USE_MOCK_DATA=$NEXT_PUBLIC_USE_MOCK_DATA
RUN test -n "$NEXT_PUBLIC_API_URL" || (echo "NEXT_PUBLIC_API_URL build arg is required" && exit 1)
RUN npm run build

# Production Runtime Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy standalone build assets. In this monorepo the standalone server lives at
# apps/frontend/server.js, so static assets must sit next to it, not at /app.
COPY --from=builder --chown=node:node /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=node:node /app/apps/frontend/public ./apps/frontend/public
COPY --from=builder --chown=node:node /app/apps/frontend/.next/static ./apps/frontend/.next/static

USER node

EXPOSE 3000

CMD ["node", "apps/frontend/server.js"]
