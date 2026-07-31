# Le'Kiray ERP — Production Launch Readiness Checklist

This document details the mandatory quality gates that must pass prior to authorizing production deployment.

---

## Quality Gate Summary

> Status Options: `Pending` | `Passed` | `Failed` | `Blocked`

| Gate | Category | Runtime Status | Verification Method |
|------|----------|----------------|---------------------|
| Gate 1 | Security & Auth | Pending | Helmet, Throttler, Lockout, Secure Cookies, Redacted Logger |
| Gate 2 | RBAC & Permissions | Pending | `npm run audit:rbac` & `npm run test:rbac` |
| Gate 3 | Multi-Tenant Isolation | Pending | `npm run test:tenant-real` |
| Gate 4 | Database & Indexes | Pending | In-Container `prisma migrate deploy` & Composite Indexes |
| Gate 5 | Frontend Hardening | Pending | `error.tsx`, `not-found.tsx`, Standalone Output, Env Safety |
| Gate 6 | Observability & Health | Pending | `/api/health` & `/api/health/db` Endpoints |
| Gate 7 | Infrastructure & Network | Pending | Official Docker Repo, UFW Firewall (80/443 only), Log Rotation |
| Gate 8 | Backup & Recovery Test | Pending | Backup Generation & Verification of Restore Procedure |
| Gate 9 | CI/CD & SSL Verification | Pending | `.github/workflows/ci.yml` & Certbot Auto-Renewal |

---

## Detailed Gate Verification Checklist

### 1. Security Gate
- [ ] Secrets stored strictly in environment variables (no hardcoded passwords/tokens in git).
- [ ] Helmet HTTP security headers enabled in NestJS backend.
- [ ] Strict CORS origin validation enabled (`CORS_ORIGINS` / `FRONTEND_URL`).
- [ ] Rate limiting active via `@nestjs/throttler` (global + 5-attempt login throttle).
- [ ] Account lockout triggered after 5 failed login attempts (15-minute lock).
- [ ] Refresh tokens stored in `HttpOnly`, `Secure`, `SameSite=Lax` cookies with rotation.
- [ ] Global exception filter sanitizes internal stack traces in production.
- [ ] Security event logger redacting passwords, tokens, and national IDs.

### 2. RBAC & Data Isolation Gate
- [ ] Automated RBAC audit script (`npm run audit:rbac`) passes with 0 errors.
- [ ] All controller routes protected by JwtAuthGuard + PermissionsGuard.
- [ ] Every business record explicitly scoped by `companyId`.
- [ ] Real PostgreSQL tenant isolation tests (`npm run test:tenant-real`) pass 100%.

### 3. Database & Performance Gate
- [ ] Production migration strategy executed inside container (`docker compose exec backend npx prisma migrate deploy`).
- [ ] Production seeder (`seed-production.ts`) executed without demo data.
- [ ] High-frequency composite tenant indexes verified in `schema.prisma`.
- [ ] Database connection pooling and graceful disconnection configured.

### 4. Frontend Resilience & Environment Safety Gate
- [ ] Next.js standalone build enabled (`output: 'standalone'`).
- [ ] Root Error Boundary (`error.tsx`) catches client exceptions.
- [ ] Custom 404 page (`not-found.tsx`) configured.
- [ ] Global loading fallback (`loading.tsx`) operational.
- [ ] `NEXT_PUBLIC_USE_MOCK_DATA=false` in production env.
- [ ] **Environment Variable Safety**: Only browser-safe variables use `NEXT_PUBLIC_`. No secrets in `NEXT_PUBLIC_*`.

### 5. Infrastructure & Operations Gate
- [ ] **Preflight Validation**: `docker compose -f docker-compose.prod.yml config` passes cleanly.
- [ ] **Docker Installation**: Docker Engine installed via official apt repository (not convenience script).
- [ ] **Firewall Setup**: UFW firewall active. Ports 80 and 443 public ONLY. PostgreSQL (5432) and backend (4000) bound to loopback `127.0.0.1`.
- [ ] Multi-stage Dockerfiles for backend and frontend built cleanly.
- [ ] Production Compose stack (`docker-compose.prod.yml`) configured with `restart: unless-stopped`, health checks, and log rotation (`10m`, 5 files max).
- [ ] Nginx reverse proxy template (`deploy/nginx/le-kiray.conf`) with Let's Encrypt SSL.
- [ ] Certbot renewal dry-run verified (`certbot renew --dry-run`).
- [ ] Automated daily database backup (`backup-db.sh`) and **mandatory restore procedure verified** (`restore-db.sh`).
- [ ] GitHub Actions CI pipeline (`.github/workflows/ci.yml`) active.

---

## Launch Authorization Sign-off Checklist

*(To be signed off by deployment engineer during actual production launch)*

- [ ] All 9 Quality Gates marked as **PASSED**
- [ ] Firewall verified (Ports 80/443 public only)
- [ ] In-container migration verified (`npx prisma migrate deploy`)
- [ ] Backup restoration procedure tested and verified
- [ ] Zero blocker security issues remaining
- [ ] Deployment Engineer Approval Signature: ______________________ Date: _________
