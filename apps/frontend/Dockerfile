# Multi-stage Dockerfile for Next.js Standalone Frontend App
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./
COPY apps/frontend/package*.json ./apps/frontend/

# Install dependencies
RUN npm ci

# Copy frontend source and build standalone output
COPY apps/frontend ./apps/frontend
WORKDIR /app/apps/frontend
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production Runtime Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy standalone build assets
COPY --from=builder /app/apps/frontend/public ./public
COPY --from=builder /app/apps/frontend/.next/standalone ./
COPY --from=builder /app/apps/frontend/.next/static ./.next/static

USER node

EXPOSE 3000

CMD ["node", "apps/frontend/server.js"]
