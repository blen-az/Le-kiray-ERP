# Le'Kiray ERP — Production Deployment Guide

This guide details the exact production deployment procedure for **Le'Kiray Contractor ERP** using Docker Engine (Official Repository), Nginx, Let's Encrypt SSL, UFW Firewall, and PostgreSQL on Linux VPS environments (Ubuntu 22.04 LTS / Debian 12).

---

## 1. System Requirements & Security Notes

- **OS**: Ubuntu 22.04 LTS or Debian 12
- **CPU**: Minimum 2 Cores (4 Cores recommended for heavy site operations)
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: Minimum 40GB SSD
- **Dependencies**: Docker Engine (Official Apt Repo), Docker Compose v2, Nginx, Certbot, UFW

> [!CAUTION]
> **Docker Security Warning**: Adding users to the `docker` group effectively grants root-level privileges on the server. Only trusted deployment user accounts should be added to the `docker` group.

---

## 2. Server Installation & Firewall Configuration

### 2.1 Install Docker Engine via Official Apt Repository

> [!IMPORTANT]
> **Production Installation Rule**: For production servers, install Docker Engine from Docker's official apt repository. Do not rely on the convenience script (`get-docker.sh`) as the primary production installation path.

```bash
# Remove any old or conflicting packages
sudo apt-get remove -y docker docker-engine docker.io containerd runc || true

# Set up Docker's official apt repository
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg lsb-release

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine & Compose plugin
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin nginx certbot python3-certbot-nginx ufw

# Add deploy user to docker group (Only trusted deploy user!)
sudo usermod -aG docker $USER
```

### 2.2 UFW Firewall & Port Exposure Rules

> [!WARNING]
> **Strict Port Exposure Policy**:
> - Only expose ports **22/tcp** (SSH), **80/tcp** (HTTP), and **443/tcp** (HTTPS) to the public internet.
> - **Do not publicly expose PostgreSQL (5432)** or backend container ports (4000) directly.
> - Only Nginx should be publicly accessible.
> - Backend and PostgreSQL communicate strictly through loopback bindings (`127.0.0.1`) or internal Docker networks.

Configure UFW firewall:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status verbose
```

---

## 3. Environment Variable Safety & Provisioning

### 3.1 Environment Safety Rules

> [!IMPORTANT]
> **Browser Exposure Rule**: Only variables that are completely safe to expose to client browsers may use the `NEXT_PUBLIC_` prefix. **NEVER** place database credentials, JWT secrets, or cloud access keys in `NEXT_PUBLIC_*` variables.

| Variable | Environment | Safety Classification | Example |
|----------|-------------|-----------------------|---------|
| `NEXT_PUBLIC_API_URL` | Frontend | ✅ SAFE (Public URL) | `https://api.yourdomain.com/api` |
| `NEXT_PUBLIC_USE_MOCK_DATA` | Frontend | ✅ SAFE (Public Flag) | `false` |
| `NEXT_PUBLIC_APP_ENV` | Frontend | ✅ SAFE (Metadata) | `production` |
| `DATABASE_URL` | Backend | ❌ UNSAFE (Keep Secret) | `postgresql://user:pass@host/db` |
| `JWT_SECRET` | Backend | ❌ UNSAFE (Keep Secret) | `32+ char random string` |
| `JWT_REFRESH_SECRET` | Backend | ❌ UNSAFE (Keep Secret) | `32+ char random string` |
| `S3_SECRET_ACCESS_KEY` | Backend | ❌ UNSAFE (Keep Secret) | `secret-key-value` |

### 3.2 Clone Codebase & Setup Env Files

```bash
git clone <your-private-repo-url> /opt/lekiray-erp
cd /opt/lekiray-erp

# Copy template configurations
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env.local
```

Fill in backend secrets (`JWT_SECRET`, `JWT_REFRESH_SECRET`, `POSTGRES_PASSWORD`, `CORS_ORIGINS`, `FRONTEND_URL`, `NEXT_PUBLIC_API_URL`) in `apps/backend/.env` and `.env`.

---

## 4. Compose Preflight Validation & Stack Launch

### 4.1 Execute Compose Preflight Command

> [!IMPORTANT]
> **Preflight Variable Validation**: Run the `config` preflight command before starting containers. This validates compose variable substitution and fails fast if any required variables (`POSTGRES_PASSWORD`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL`, `CORS_ORIGINS`, `NEXT_PUBLIC_API_URL`) are missing.

```bash
cd /opt/lekiray-erp

# Preflight check: Must return clean rendered yaml without error
docker compose -f docker-compose.prod.yml config
```

### 4.2 Launch Production Container Stack

Build and start containers using production settings (`restart: unless-stopped`, loopback bindings, log rotation limits):

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Verify running containers:

```bash
docker compose -f docker-compose.prod.yml ps
```

---

## 5. In-Container Database Migration & Production Seeding

> [!IMPORTANT]
> **Production Migration Rule**: Always run `prisma migrate deploy` inside the backend container using `docker compose exec`. Do not run `prisma migrate dev` in production, and do not assume the host machine has Node dependencies installed.

### 5.1 Run Production Migration

```bash
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### 5.2 Seed Production Base System

> [!NOTE]
> **Seed Separation Rule**: `seed.ts` contains fake demo data (ABC Construction PLC, fake machinery, fake logs) and is for staging/demo only. `seed-production.ts` seeds ONLY required permissions, base system roles, and the initial Super Admin.

Set `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD` (12+ characters, not the example value), `INITIAL_ADMIN_NAME` and `INITIAL_COMPANY_NAME` in `.env` first. The compiled seeder ships inside the image (`src/` does not):

```bash
docker compose -f docker-compose.prod.yml exec backend node dist/seed-production.js
```

> [!IMPORTANT]
> **Re-run on every release.** The production seeder is idempotent: it syncs every permission from `src/auth/permission-registry.ts` and grants any new ones to the `CEO / Owner` role. Without this step, new modules (e.g. Tenders) return 403 for existing admins. Users must sign out and back in afterwards to pick up new permissions.

### 5.3 Upgrading an Existing Database Created with `db push`

If a server was set up before migrations were committed (tables already exist), mark the baseline as applied once, then deploy normally:

```bash
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate resolve --applied 0_init
```

Note that `0_init` includes the `tenders` tables, so on such a server you must first create them with `npx prisma db push` (or apply the tender section of `prisma/migrations/0_init/migration.sql` manually) before resolving.

---

## 6. Nginx Reverse Proxy & First-Time SSL Bootstrap

> [!WARNING]
> **First-Time SSL Bootstrapping Note**:
> The final Nginx SSL config (`deploy/nginx/le-kiray.conf`) references SSL certificate files (`/etc/letsencrypt/live/erp.yourdomain.com/fullchain.pem`). If you link this config before Certbot creates the certificates, `sudo nginx -t` will fail because the certificate files do not exist yet. Follow the two-stage bootstrap process below.

### 6.1 Step 1: Create Temporary HTTP Bootstrap Config

Create `/etc/nginx/sites-available/le-kiray-init.conf`:

```nginx
server {
    listen 80;
    server_name erp.yourdomain.com api.yourdomain.com;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 200 'SSL Bootstrap in progress...';
    }
}
```

Enable the temporary HTTP config:

```bash
sudo mkdir -p /var/www/html
sudo ln -s /etc/nginx/sites-available/le-kiray-init.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 6.2 Step 2: Issue Shared Certificate with Certbot

Issue a single shared SSL certificate covering both domains (`erp.yourdomain.com` and `api.yourdomain.com`):

```bash
sudo certbot certonly --webroot -w /var/www/html -d erp.yourdomain.com -d api.yourdomain.com
```

### 6.3 Step 3: Enable Final SSL Nginx Configuration

Now that certificate files exist at `/etc/letsencrypt/live/erp.yourdomain.com/`, enable the final production configuration:

```bash
sudo rm -f /etc/nginx/sites-enabled/le-kiray-init.conf
sudo cp deploy/nginx/le-kiray.conf /etc/nginx/sites-available/le-kiray.conf
sudo ln -s /etc/nginx/sites-available/le-kiray.conf /etc/nginx/sites-enabled/

# Test final SSL Nginx configuration syntax
sudo nginx -t
sudo systemctl reload nginx
```

### 6.4 Verify Certbot SSL Auto-Renewal

```bash
# Verify Automatic Renewal Dry-Run
sudo certbot renew --dry-run

# Verify Certbot Systemd Timer Status
sudo systemctl status certbot.timer
```

---

## 7. Backup & Mandatory Restoration Testing

> [!CAUTION]
> **Restoration Verification Rule**: A database backup that has never been restored should **NEVER** be trusted. Test restoring your backup into a clean database prior to launching production.

### 7.1 Automated Backup Setup

Set up daily 2:00 AM PostgreSQL database backups in `crontab`:

```bash
chmod +x scripts/backup-db.sh scripts/restore-db.sh
crontab -e
```

Add cron entry:

```cron
0 2 * * * /opt/lekiray-erp/scripts/backup-db.sh >> /var/log/lekiray-backup.log 2>&1
```

### 7.2 Execute Restoration Procedure Test

```bash
# Step 1: Create fresh backup
/opt/lekiray-erp/scripts/backup-db.sh

# Step 2: Test restoration into clean database
/opt/lekiray-erp/scripts/restore-db.sh /opt/lekiray-erp/backups/lekiray_db_backup_<timestamp>.sql.gz
```

---

## 8. Health Check Verification & Smoke Testing

### 8.1 API & Database Health Probes

```bash
curl -i https://api.yourdomain.com/api/health
curl -i https://api.yourdomain.com/api/health/db
```

Both endpoints must return `200 OK` with `"status": "ok"` and `"database": "connected"`.

### 8.2 Smoke Test Manual Checklist

Verify all major routes render cleanly as CEO / Administrator:

- [ ] **Login**: Log in at `https://erp.yourdomain.com/login` (`admin@yourdomain.com`).
- [ ] **Dashboard** (`/dashboard`): Real KPI summary metrics load.
- [ ] **Projects & Sites** (`/dashboard/projects`): Directory loads.
- [ ] **Machinery** (`/dashboard/machinery`): Equipment fleet loads.
- [ ] **Fuel Management** (`/dashboard/fuel`): Requests & logs load.
- [ ] **Inventory** (`/dashboard/inventory`): Item list and stock movements load.
- [ ] **HR & Attendance** (`/dashboard/hr`): Employee records and attendance load.
- [ ] **Daily Site Reports** (`/dashboard/reports`): Daily site reports load.
- [ ] **Maintenance** (`/dashboard/maintenance`): Equipment repair logs load.
- [ ] **Finance Lite** (`/dashboard/finance`): Operational expenses & budgets load.
- [ ] **Settings** (`/dashboard/settings`): Workspace settings load.
- [ ] **Logout**: Log out clears HttpOnly session cookies.
- [ ] **Access Control**: Unauthorized route attempts display Access Denied.

---

## 9. Final Production Launch Quality Gates

Run all automated quality gates before opening traffic:

```bash
npm run build --workspace=apps/backend
npm run build --workspace=apps/frontend
npm run test:rbac --workspace=apps/backend
npm run audit:rbac --workspace=apps/backend
npm run test:tenant-real --workspace=apps/backend
```

### Preflight Command Verification:
```bash
docker compose -f docker-compose.prod.yml config
```

### Final Deployment Verification Checklist:
- [ ] `docker compose config` preflight passed with zero missing environment variable errors.
- [ ] HTTPS enforced & Certbot renewal dry-run verified.
- [ ] Session cookies set to `HttpOnly`, `Secure`, `SameSite=Lax`.
- [ ] CORS restricted exclusively to production frontend domain.
- [ ] Mock data disabled (`NEXT_PUBLIC_USE_MOCK_DATA=false`).
- [ ] Production seed run (no fake demo data).
- [ ] Database backup and restoration test verified.
- [ ] Health check endpoints pass (`200 OK`).
- [ ] Container log rotation enabled (`10m`, 5 files max).
- [ ] Firewall active with ONLY ports 80 and 443 publicly accessible.
