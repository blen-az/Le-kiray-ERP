# Cloud Deployment — Vercel + Render + Neon (no custom domain needed)

```
Browser ──► https://<app>.vercel.app            (Next.js on Vercel)
               └── /api/*  ──rewrite──► https://lekiray-api.onrender.com/api/*   (NestJS on Render)
                                                  └──► Neon PostgreSQL (Frankfurt)
```

The browser only ever talks to the Vercel URL. Vercel proxies `/api/*` to the backend, so the
login refresh cookie is first-party and works without a custom domain. Adding a domain later
needs no code changes — just update `CORS_ORIGINS` / `FRONTEND_URL`.

Do the steps in order: database → backend → frontend → point backend back at the frontend.

## 1. Database — Neon

1. Create a project at neon.tech, region **AWS Europe Central 1 (Frankfurt)**.
2. From **Connection Details**, copy two strings:
   - **Pooled** connection (host contains `-pooler`) → append `&pgbouncer=true` → this is `DATABASE_URL`
   - **Direct** connection (toggle "Connection pooling" off) → this is `DIRECT_URL`

## 2. Backend — Render

1. Render dashboard → **New → Blueprint** → choose the `Le-kiray-ERP` repo. It reads `render.yaml`.
2. Fill in the prompted variables:
   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Neon pooled string |
   | `DIRECT_URL` | Neon direct string |
   | `CORS_ORIGINS`, `FRONTEND_URL` | `https://placeholder.vercel.app` for now (fixed in step 4) |
   | `INITIAL_ADMIN_EMAIL` | your admin login email |
   | `INITIAL_ADMIN_PASSWORD` | strong password, 12+ characters |
   | `INITIAL_COMPANY_NAME` | your company name |
3. Deploy. The start command runs migrations, syncs permissions, creates the admin, then starts the API.
4. Check `https://lekiray-api.onrender.com/api/health` returns `"database":"ok"`.
5. After the first successful deploy, delete `INITIAL_ADMIN_PASSWORD` from Render's environment.

## 3. Frontend — Vercel

1. vercel.com → **Add New → Project** → import the `Le-kiray-ERP` repo.
2. **Root Directory**: `apps/frontend` (framework auto-detects as Next.js).
3. Environment variables (Production and Preview):
   | Variable | Value |
   |---|---|
   | `BACKEND_URL` | `https://lekiray-api.onrender.com` (no trailing `/api`) |
   | `NEXT_PUBLIC_API_URL` | `/api` |
   | `NEXT_PUBLIC_USE_MOCK_DATA` | `false` |
4. Deploy and note the production URL, e.g. `https://le-kiray-erp.vercel.app`.

## 4. Connect them

In Render, set `CORS_ORIGINS` and `FRONTEND_URL` to the exact Vercel production URL
(no trailing slash) and redeploy. Then sign in at the Vercel URL with the admin account.

> Vercel **preview** deployments have different URLs and are not in `CORS_ORIGINS`, so
> sign-in/saving there will fail. Add a preview URL to `CORS_ORIGINS` (comma-separated) if you need one.

## Every release

Merging to `main` redeploys both automatically. Migrations and permission sync run on backend
start, so new modules work immediately; users must sign out and back in to pick up new permissions.

## Costs (approximate)

- Vercel Hobby: free (commercial use requires Pro, $20/mo)
- Render Starter: ~$7/mo (free plan sleeps and is not suitable for real users)
- Neon Free: 0.5 GB storage; upgrade when data grows. Enable Neon's point-in-time restore on a paid plan for real backups.
