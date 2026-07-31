# Multi-stage Dockerfile for NestJS Backend API
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root dependencies and app package files
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY apps/backend/prisma ./apps/backend/prisma

# Install dependencies
RUN npm ci

# Copy source code and build backend
COPY apps/backend ./apps/backend
WORKDIR /app/apps/backend
RUN npx prisma generate
RUN npm run build

# Production Runtime Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install openssl for Prisma
RUN apk add --no-libc -U openssl

# Copy dependencies and build outputs
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma

WORKDIR /app/apps/backend

# Create non-root node user for container security
USER node

EXPOSE 4000

CMD ["node", "dist/main"]
