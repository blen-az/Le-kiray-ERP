# Le'Kiray Contractor ERP

> A full-stack ERP system purpose-built for Ethiopian construction contractors.

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)](https://prisma.io)

---

## What is Le'Kiray ERP?

Le'Kiray ERP helps Ethiopian construction contractors manage their entire operation from a single platform:

| Module | Description |
|--------|-------------|
| 🏗️ Projects & Sites | Project lifecycle management with site tracking |
| 🚜 Machinery | Heavy equipment fleet, operators, assignments |
| ⛽ Fuel | Fuel requests, approvals, dispensing, and cost tracking |
| 📦 Inventory | Warehouse, materials, stock-in/out, transfers, requests |
| 👷 HR & Attendance | Employee records, assignments, daily attendance, leave |
| 📋 Daily Reports | Site reports with approval workflow |
| 🔧 Maintenance | Machine breakdowns, preventive service, repair costs |
| 💰 Finance Lite | Operational expenses, project cost analytics, profitability |
| 📊 CEO Dashboard | Real-time KPI overview across all operations |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend API | NestJS (Node.js) + TypeScript |
| ORM | Prisma |
| Database | PostgreSQL 15 |
| Auth | JWT (access + refresh tokens) + bcrypt |
| Authorization | Role-Based Access Control (RBAC) with 40+ fine-grained permissions |
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Icons | Lucide React |
| API Docs | Swagger (auto-generated at `/api/docs`) |
| Container | Docker Compose |

---

## Quick Start

### Prerequisites

- Node.js 18+
- Docker Desktop (for PostgreSQL)
- npm 9+

### 1. Clone and Install

```bash
git clone <repo-url>
cd Le-kiray-ERP
npm install
cd apps/backend && npm install
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env
# Edit apps/backend/.env and fill in your values

# Frontend
cp apps/frontend/.env.example apps/frontend/.env.local
# Edit apps/frontend/.env.local
```

### 3. Start PostgreSQL

```bash
docker compose up -d
```

### 4. Run Database Migrations

```bash
cd apps/backend
npx prisma migrate dev
```

### 5. Seed Demo Data

```bash
cd apps/backend
npx ts-node src/seed.ts
```

### 6. Start the Backend

```bash
cd apps/backend
npm run start:dev
# API available at http://localhost:4000
# Swagger docs at http://localhost:4000/api/docs
```

### 7. Start the Frontend

```bash
cd apps/frontend
npm run dev
# App available at http://localhost:3000
```

---

## Environment Variables

### Backend (`apps/backend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/lekiray` |
| `JWT_SECRET` | JWT signing secret (keep long & random) | `your-super-secret-jwt-key-minimum-32-chars` |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | `your-refresh-secret` |
| `JWT_EXPIRES_IN` | Access token expiry | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | `7d` |
| `PORT` | Backend server port | `4000` |

### Frontend (`apps/frontend/.env.local`)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:4000/api` |
| `NEXT_PUBLIC_USE_MOCK_DATA` | Use mock data (no backend needed) | `false` |

---

## Demo User Accounts

All passwords: **`Password123!`**

| Role | Email | Access Level |
|------|-------|-------------|
| CEO / Owner | `ceo@abcconstruction.com` | All modules — full read/write |
| Project Manager | `pm@abcconstruction.com` | Projects, Reports, HR view, Finance view |
| Fleet Manager | `fleet@abcconstruction.com` | Machinery, Fuel, Maintenance |
| Inventory Manager | `inventory@abcconstruction.com` | Full inventory control |
| HR Manager | `hr@abcconstruction.com` | Employees, Attendance, Leave |
| Finance Officer | `finance@abcconstruction.com` | Expenses, Reports, Profitability |
| Site Manager | `site@abcconstruction.com` | Fuel requests, Attendance, Daily reports |

---

## Important Routes

### Frontend Pages

| Route | Description |
|-------|-------------|
| `/` | Landing / redirect to dashboard |
| `/login` | Authentication page |
| `/dashboard` | CEO Dashboard |
| `/dashboard/projects` | Projects directory |
| `/dashboard/machinery` | Machinery fleet |
| `/dashboard/fuel` | Fuel management |
| `/dashboard/inventory` | Inventory & materials |
| `/dashboard/hr` | HR & attendance |
| `/dashboard/reports` | Daily site reports |
| `/dashboard/maintenance` | Maintenance management |
| `/dashboard/finance` | Finance Lite |
| `/dashboard/settings` | Company settings & users |

### Backend API

| Route | Description |
|-------|-------------|
| `GET /api/docs` | Swagger UI (all endpoints) |
| `POST /api/auth/login` | Login |
| `POST /api/auth/refresh` | Refresh token |
| `GET /api/projects` | Projects list |
| `GET /api/machinery` | Machinery list |
| `GET /api/fuel/requests` | Fuel requests |
| `GET /api/inventory/items` | Inventory items |
| `GET /api/hr/employees` | Employees |
| `GET /api/reports/daily-site` | Daily reports |
| `GET /api/maintenance` | Maintenance records |
| `GET /api/finance/summary` | Finance summary |
| `GET /api/dashboard/summary` | CEO dashboard KPIs |

---

## Multi-Tenancy

Every record is scoped to a `companyId`. No tenant can access another tenant's data. This is enforced at the service layer — not just the route level — using `JwtAuthGuard` + `PermissionsGuard` + `@CurrentUser('companyId')` on every endpoint.

---

## Development

```bash
# Backend type check
cd apps/backend && npx tsc --noEmit

# Frontend type check
cd apps/frontend && npx tsc --noEmit

# Run tenant isolation tests
cd apps/backend && npx ts-node src/test-tenant-isolation-real.ts

# Regenerate Prisma client after schema changes
cd apps/backend && npx prisma generate

# Create new migration
cd apps/backend && npx prisma migrate dev --name <migration-name>
```

---

## Project Structure

```
Le-kiray-ERP/
├── apps/
│   ├── backend/              # NestJS API
│   │   ├── src/
│   │   │   ├── auth/         # JWT auth + RBAC
│   │   │   ├── projects/     # Projects + Sites
│   │   │   ├── machinery/    # Heavy equipment
│   │   │   ├── fuel/         # Fuel management
│   │   │   ├── inventory/    # Inventory
│   │   │   ├── hr/           # HR & attendance
│   │   │   ├── reports/      # Daily reports
│   │   │   ├── maintenance/  # Maintenance
│   │   │   ├── finance/      # Finance Lite
│   │   │   ├── dashboard/    # CEO dashboard
│   │   │   └── seed.ts       # Demo data
│   │   └── prisma/
│   │       └── schema.prisma # Full DB schema
│   └── frontend/             # Next.js 14 App Router
│       └── src/app/dashboard/
│           └── ...           # All module pages
├── docker-compose.yml        # PostgreSQL container
├── DEMO_FLOW.md              # Step-by-step demo
└── TESTING_CHECKLIST.md      # QA checklist
```
