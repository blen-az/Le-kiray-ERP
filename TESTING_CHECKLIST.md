# Le'Kiray ERP — Testing Checklist

> QA checklist for MVP demo readiness verification

---

## Pre-Test Setup

- [ ] Docker PostgreSQL running (`docker compose up -d`)
- [ ] Backend running (`npm run start:dev` in `apps/backend`)
- [ ] Database migrated (`npx prisma migrate dev`)
- [ ] Demo data seeded (`npx ts-node src/seed.ts`)
- [ ] Frontend running (`npm run dev` in `apps/frontend`)
- [ ] `NEXT_PUBLIC_USE_MOCK_DATA=false` in `.env.local`

---

## Auth Module

- [ ] Login with `ceo@abcconstruction.com` / `Password123!` → success
- [ ] Login with `pm@abcconstruction.com` / `Password123!` → success
- [ ] Login with wrong password → shows error message
- [ ] JWT token returned and stored in cookie/storage
- [ ] Logout clears session
- [ ] Access protected route without token → redirect to login

---

## CEO Dashboard (`/dashboard`)

- [ ] Page loads with real data from backend
- [ ] Active projects count matches Projects module
- [ ] Machinery count matches Machinery module
- [ ] Fuel today cost matches Fuel module
- [ ] Pending fuel requests count is correct
- [ ] Inventory low stock alerts shown
- [ ] Daily reports count matches Reports module
- [ ] Maintenance active issues shown
- [ ] Finance total cost shown

---

## Projects & Sites (`/dashboard/projects`)

- [ ] Projects list loads (3 projects in demo)
- [ ] Status badges correct (Active, Active, On Hold)
- [ ] Click project → project detail loads
- [ ] Project detail shows: client, budget, dates, sites
- [ ] Sites list visible on project detail
- [ ] "Add Site" button visible to CEO/PM
- [ ] Create new project → success
- [ ] Edit project → success
- [ ] Delete project → confirmation + success

---

## Machinery (`/dashboard/machinery`)

- [ ] Machinery list loads (5 machines in demo)
- [ ] Status badges correct (Active, Idle, Under Maintenance)
- [ ] Click machine → detail page loads
- [ ] Machine detail shows: operator, fuel logs, maintenance history
- [ ] "Assign to Site" button works
- [ ] Create new machine → success
- [ ] Filter by status works

---

## Fuel Management (`/dashboard/fuel`)

- [ ] Fuel requests list loads
- [ ] Status badges visible (Pending, Approved, Issued, Rejected)
- [ ] "Approve" button visible for Fleet Manager / CEO
- [ ] Approve request → status changes to Approved
- [ ] "Issue Fuel" → creates fuel log
- [ ] Create new fuel request → success
- [ ] Fuel logs tab shows usage history

---

## Inventory (`/dashboard/inventory`)

- [ ] Inventory items list loads (10 items)
- [ ] Low stock alert on Electric Cable 4mm
- [ ] Out of stock status on Waterproofing Chemical
- [ ] Click item → item detail loads
- [ ] Stock movement history visible on item detail
- [ ] "Stock In" → quantity increases
- [ ] "Stock Out" → quantity decreases
- [ ] Material requests list visible
- [ ] Pending request approve → status changes
- [ ] Warehouses page loads (6 warehouses)

---

## HR & Attendance (`/dashboard/hr`)

- [ ] Employees list loads (11 employees)
- [ ] Click employee → employee detail loads
- [ ] Attendance records visible
- [ ] Leave requests visible (Approved, Pending, Rejected)
- [ ] Record attendance form works
- [ ] Today's attendance summary visible

---

## Daily Site Reports (`/dashboard/reports`)

- [ ] Reports list loads (4 reports)
- [ ] Status badges correct (Approved, Submitted, Draft, Rejected)
- [ ] Click report → detail page loads
- [ ] Approved report shows: workers, machinery, fuel, materials, issues
- [ ] Create new report → success
- [ ] Submit report → status changes to Submitted
- [ ] Approve report (CEO/PM) → status changes

---

## Maintenance Management (`/dashboard/maintenance`)

- [ ] Maintenance list loads (3+ records)
- [ ] Status badges correct (In Progress, Scheduled, Completed)
- [ ] Priority badges correct (Urgent, Critical, Normal)
- [ ] Click record → detail page loads
- [ ] Detail shows: machine, issue, diagnosis, parts, cost
- [ ] "Start Repair" button visible
- [ ] "Complete" button visible
- [ ] Create new maintenance record → success
- [ ] Schedule page loads and shows upcoming services

---

## Finance Lite (`/dashboard/finance`)

- [ ] Finance dashboard loads with summary KPIs
- [ ] Expense list loads (9+ expenses)
- [ ] Filter by project works
- [ ] Filter by category works
- [ ] Create new expense → success
- [ ] Approve expense (CEO/Finance Officer) → status changes
- [ ] Project costs page loads with budget bars
- [ ] Finance reports page loads with charts
- [ ] Profitability page loads with margin table

---

## Settings (`/dashboard/settings`)

- [ ] Settings page loads
- [ ] Company profile visible (ABC Construction PLC)
- [ ] Demo users table visible (7 users)
- [ ] Roles & permissions list visible
- [ ] Subscription plan card visible
- [ ] Audit log placeholder visible

---

## Cross-Cutting QA

### Loading States
- [ ] All list pages show spinner while loading
- [ ] Detail pages show spinner while loading

### Empty States
- [ ] Filtering to no results shows empty state message
- [ ] Empty state has a CTA button

### Error States
- [ ] Backend down → shows error message (not crash)
- [ ] 404 routes → fallback page visible

### Responsive Layout
- [ ] Desktop (1440px) — all pages look correct
- [ ] Tablet (768px) — sidebar collapses or scrolls
- [ ] Mobile (375px) — tables scroll horizontally, cards stack

### Security
- [ ] Fleet Manager cannot access `/api/finance` → 403
- [ ] Site Manager cannot approve fuel request → 403
- [ ] Company A cannot see Company B data → verified by tenant isolation test

---

## Backend API Audit (via Swagger)

Visit `http://localhost:4000/api/docs` and verify:

- [ ] Auth endpoints present
- [ ] All CRUD endpoints for each module present
- [ ] Approve/reject endpoints present
- [ ] Bearer token authentication working
- [ ] All endpoints return proper HTTP status codes (200, 201, 400, 401, 403, 404)

---

## Tenant Isolation Test

```bash
cd apps/backend
npx ts-node src/test-tenant-isolation-real.ts
```

- [ ] All 8 isolation checks PASS
- [ ] No cross-company data leakage

---

## Final Build Test

```bash
# Backend production build
cd apps/backend && npm run build

# Frontend production build
cd apps/frontend && npm run build
```

- [ ] Backend build passes with 0 errors
- [ ] Frontend build passes with 0 errors
- [ ] No TypeScript errors (`tsc --noEmit`)

---

## Known Limitations (Out of Scope for MVP)

- No email notifications
- No file upload for receipts/photos (placeholder only)
- No mobile app
- No payroll processing (Finance Lite only)
- No audit log viewer UI (v2.0)
- No multi-language support (Amharic planned v2.0)
- No offline mode
