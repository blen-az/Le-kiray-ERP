# Le'Kiray ERP — Production Smoke Testing Guide

This manual specifies the essential verification steps required to validate a fresh production deployment before opening access to users.

---

## 1. Health API Verification

1. Request `/api/health` via browser or curl:
   ```bash
   curl -i https://api.yourdomain.com/api/health
   ```
2. Verify response is `200 OK` with payload:
   ```json
   {
     "status": "ok",
     "api": "ok",
     "database": "ok",
     "uptimeSeconds": 120
   }
   ```
3. Request `/api/health/db`:
   ```bash
   curl -i https://api.yourdomain.com/api/health/db
   ```
   Verify response is `200 OK` with `"database": "connected"`.

---

## 2. Authentication & Security Verification

1. **Login Test**:
   - Navigate to `https://erp.yourdomain.com/login`
   - Log in with `admin@yourdomain.com` / `INITIAL_ADMIN_PASSWORD`
   - Verify successful redirect to `/dashboard`
   - Verify access token is received and `refreshToken` cookie is set as `HttpOnly` and `Secure`.
2. **Invalid Password Throttling**:
   - Attempt 5 consecutive invalid login attempts with invalid password.
   - Verify 5th attempt is rejected with 403 Account Lockout message.
3. **Logout Test**:
   - Click "Logout" in header user menu.
   - Verify redirect to `/login` and `refreshToken` cookie cleared.
4. **Unauthorized Access Denial**:
   - Open incognito window and navigate directly to `https://erp.yourdomain.com/dashboard`.
   - Verify immediate redirect to `/login`.

---

## 3. Module Operations Verification

Log in as CEO / Administrator and verify loading without client console errors:

- [ ] **CEO Dashboard** (`/dashboard`): Summary KPIs load real database metrics.
- [ ] **Projects & Sites** (`/dashboard/projects`): Directory loads projects and site listings.
- [ ] **Machinery** (`/dashboard/machinery`): Equipment list and assignment modal load.
- [ ] **Fuel Management** (`/dashboard/fuel`): Requests table and approval action button work.
- [ ] **Inventory** (`/dashboard/inventory`): Item list and stock movements load cleanly.
- [ ] **HR & Attendance** (`/dashboard/hr`): Employee roster and daily attendance summary render.
- [ ] **Daily Site Reports** (`/dashboard/reports`): Daily site reports list renders properly.
- [ ] **Maintenance** (`/dashboard/maintenance`): Equipment repair logs load.
- [ ] **Finance Lite** (`/dashboard/finance`): Operational expense table and budget progress load.
- [ ] **Settings** (`/dashboard/settings`): Company profile and user permissions render.

---

## 4. RBAC & Access Control Verification

1. Log in with a limited role account (e.g. Site Manager).
2. Verify restricted navigation items (e.g. Finance) are hidden or return Access Denied if accessed directly.
3. Run CLI RBAC Audit:
   ```bash
   cd apps/backend && npm run audit:rbac
   ```
   Verify `🎉 RBAC Production Audit Passed!`.

---

## 5. Error & Fallback Page Verification

1. Navigate to a non-existent URL: `https://erp.yourdomain.com/dashboard/nonexistent-page`.
2. Verify custom 404 page (`not-found.tsx`) renders with "Page Not Found" title and return link.
