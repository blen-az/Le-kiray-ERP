# Le'Kiray ERP — Backend

NestJS REST API with multi-tenant architecture, JWT auth, RBAC, and Prisma ORM.

## Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database URL and JWT secrets

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed demo data
npx ts-node src/seed.ts

# Start dev server
npm run start:dev
```

## API Reference

Swagger UI: **http://localhost:4000/api/docs**

All endpoints require a `Bearer <access_token>` header except `/auth/login` and `/auth/refresh`.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | JWT access token signing secret |
| `JWT_REFRESH_SECRET` | ✅ | JWT refresh token signing secret |
| `JWT_EXPIRES_IN` | ✅ | Access token expiry (e.g. `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | ✅ | Refresh token expiry (e.g. `7d`) |
| `PORT` | optional | Server port (default: 4000) |

## Module Structure

```
src/
├── auth/           # JWT auth, guards, decorators
├── projects/       # Projects + Sites CRUD
├── machinery/      # Machines, operators, assignments
├── fuel/           # Fuel requests, logs, approvals
├── inventory/      # Warehouses, items, movements, requests
├── hr/             # Employees, attendance, leave
├── reports/        # Daily site reports + approval
├── maintenance/    # Maintenance records + parts
├── finance/        # Expenses, summaries, profitability
├── dashboard/      # CEO aggregated KPIs
└── prisma/         # PrismaService
```

## Scripts

| Script | Command |
|--------|---------|
| Dev server | `npm run start:dev` |
| Build | `npm run build` |
| TypeScript check | `npx tsc --noEmit` |
| Seed data | `npx ts-node src/seed.ts` |
| Tenant isolation test | `npx ts-node src/test-tenant-isolation-real.ts` |
| Prisma generate | `npx prisma generate` |
| Prisma migrate | `npx prisma migrate dev` |
| Prisma studio | `npx prisma studio` |

## Authentication Flow

1. `POST /api/auth/login` → returns `accessToken` + `refreshToken`
2. All requests: `Authorization: Bearer <accessToken>`
3. `POST /api/auth/refresh` → rotate tokens

## Permission System

Permissions are checked by `PermissionsGuard` via `@Permissions('action:scope')` decorator.

Each user has one or more roles. Each role has a set of permissions.  
The CEO role has all 40+ permissions. Other roles have scoped permissions.

See the seed file for the full permission list.
