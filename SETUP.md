# Compliance & Risk Control Tower — Dockerized Installation & Deployment Guide

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Docker | >= 20 | Container runtime (Compose v1 or v2) |
| Git | >= 2 | Version control |

No Node.js, npm, PostgreSQL, or Redis installation required — everything runs in containers.

---

## 1. Quick Start (Development Mode)

```powershell
git clone https://github.com/fayeztekitek/compliance-and-risk-control-tower.git
cd "compliance-&-risk-control-tower"
docker-compose up -d --build
```

Wait ~30 seconds for containers to fully start:

```powershell
docker ps --filter "name=ct-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Expected output:

| Name | Status | Ports |
|------|--------|-------|
| ct-frontend | Up | `0.0.0.0:5173->5173/tcp` |
| ct-api | Up | `0.0.0.0:3000->3000/tcp` |
| ct-postgres | Up (healthy) | `0.0.0.0:5432->5432/tcp` |
| ct-redis | Up (healthy) | `0.0.0.0:6379->6379/tcp` |

**URL:** http://localhost:5173

**Login credentials (all users, password is `admin123!`):**

| Role | Email |
|------|-------|
| ADMIN | `fayez.tekitek@vermeg.com` |
| COMPLIANCE_OFFICER | `amandine.rousset@vermeg.com` |
| RISK_MANAGER | `m.dubois@vermeg.com` |
| SECURITY_MANAGER | `t.lemaire@vermeg.com` |
| PRODUCT_OWNER | `s.laroche@vermeg.com` |
| AUDITOR | `j.mercer@vermeg.com` |
| EXECUTIVE_READ_ONLY | `jp.v@vermeg.com` |

---

## 2. Services

| Service | URL | Description |
|---------|-----|-------------|
| Frontend (Vite dev server) | http://localhost:5173 | React + Vite with HMR |
| Backend API | http://localhost:3000 | Express REST API |
| Swagger API Docs | http://localhost:3000/api/docs | Interactive API documentation |
| Health Check | http://localhost:3000/api/health | Returns `{"status":"ok"}` |
| PostgreSQL | `localhost:5432` | Database |
| Redis | `localhost:6379` | Queue & cache |

---

## 3. What Happens on Startup

When you run `docker-compose up -d --build`:

1. **Docker images are built:**
   - `backend/Dockerfile` — single-stage: Node.js 20 + tsx watch (hot reload)
   - `frontend/Dockerfile` — single-stage: Node.js 20 + Vite (HMR)

2. **PostgreSQL & Redis** start first (health checks pass before API starts)

3. **API container** runs migrations:
   ```
   node node_modules/tsx/dist/cli.mjs src/scripts/runMigrations.ts
   ```
   - All 29 `.sql` migration files applied alphabetically
   - Seed data inserted (7 users, sample roadmaps, security vulns, VEG deals, etc.)
   - Already-applied migrations are skipped (tracked in `pgmigrations` table)

4. **API server** starts with `tsx watch` (auto-restart on file changes via volume mount)

5. **Frontend** starts Vite dev server with hot module replacement

6. **Volume mounts** sync local code into containers — edit files locally, changes apply instantly

---

## 4. Architecture

```
Browser ── :5173 ──► Vite Dev Server ── :3000 ──► Express API (tsx watch)
                         │                              │
                    Hot reload                     ┌─────┴──────┐
                    (local files                 PostgreSQL 16   Redis 7
                     synced via                    :5432         :6379
                     volume mount)
```

Vite's `vite.config.ts` proxies `/api/*` requests to `http://localhost:3000`, so all API calls work without CORS issues.

---

## 5. Useful Commands

```powershell
# View live logs
docker logs -f ct-api
docker logs -f ct-frontend

# Restart a single service after code changes (no rebuild needed)
docker restart ct-api

# Rebuild and restart a single service after dependency changes
docker-compose up -d --build api

# Stop everything
docker-compose down

# Full clean restart (rebuilds all images from scratch)
docker-compose down
docker-compose up -d --build

# Reset database (delete volume)
docker-compose down -v
docker-compose up -d --build

# Run backend tests
docker exec ct-api node node_modules/vitest/vitest.mjs run

# Run frontend tests
docker exec ct-frontend node node_modules/vitest/vitest.mjs run

# Access database directly
docker exec -it ct-postgres psql -U postgres -d compliance_tower
```

---

## 6. Running Tests (inside containers)

```powershell
# Backend (227 tests)
docker exec ct-api node node_modules/vitest/vitest.mjs run

# Frontend (24 tests)
docker exec ct-frontend node node_modules/vitest/vitest.mjs run

# Specific backend test
docker exec ct-api node node_modules/vitest/vitest.mjs run tests/unit/auth.service.test.ts

# Watch mode
docker exec -it ct-api node node_modules/vitest/vitest.mjs run --watch
```

---

## 7. Production Deployment

### 7.1 Build Production Images

```powershell
# Backend — 2-stage: esbuild → minified dist, then minimal runtime with prod deps only
docker build -t ct-backend:prod -f backend/Dockerfile.prod backend

# Frontend — 2-stage: vite build → static files, then nginx
docker build -t ct-frontend:prod -f frontend/Dockerfile.prod frontend
```

### 7.2 Start Production Stack

```powershell
docker-compose -f docker-compose.prod.yml up -d
```

### 7.3 Production Architecture

```
Browser ── :5173 ──► nginx ── /api/* ──► Express API (Node.js)
                         │                    :3000
                    Static files          ┌─────┴──────┐
                    (built by Vite)     PostgreSQL 16   Redis 7
```

In production, nginx:
- Serves pre-built static files from `frontend/dist/`
- Proxies `/api/*` requests to the backend container via Docker DNS (`http://api:3000`)

### 7.4 Production Image Details

**ct-backend:prod** (2-stage):
- `builder` stage: `npm install` (all deps) → `esbuild` compiles to `dist/`
- `runner` stage: `npm ci --omit=dev` (prod deps only) → copies `dist/`, `migrations/`, `package.json`
- Startup: `node dist/scripts/runMigrations.js && node dist/index.js`
- Includes `postgresql-client` for potential debugging

**ct-frontend:prod** (2-stage):
- `builder` stage: `npm install` → `vite build`
- `runner` stage: `nginx:alpine` → copies `dist/` and `nginx.conf`
- nginx proxies `/api/` to `http://api:3000` (Docker internal DNS)

### 7.5 Production Checklist

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Set `DB_PASSWORD` to a strong password
- [ ] Set `CORS_ORIGIN` to your frontend domain
- [ ] Use `LOG_LEVEL=info` (default is `debug`)
- [ ] Configure SMTP for email alerts (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`)
- [ ] Configure Slack webhook for alerts (`SLACK_WEBHOOK_URL`)
- [ ] Update `nginx.conf` if your domain requires HTTPS or custom routing

---

## 8. Development Without Docker (legacy method)

If you prefer running services natively:

### Prerequisites
| Tool | Version |
|------|---------|
| Node.js | >= 20 |
| npm | >= 9 |
| PostgreSQL 16 | running on localhost:5432 |
| Redis 7 | running on localhost:6379 |

### Setup
```powershell
# Backend
cd backend
npm install
node node_modules/tsx/dist/cli.mjs src/scripts/runMigrations.ts
node node_modules/tsx/dist/cli.mjs src/index.ts

# Frontend (separate terminal)
cd frontend
npm install
node node_modules/vite/bin/vite.js --port 5173
```

> **Note:** The `&` character in the parent directory name breaks `npm run` scripts. Always use direct `node node_modules/...` paths.

---

## 9. Environment Variables

All environment variables are defined in `docker-compose.yml` and `docker-compose.prod.yml`. Key variables:

| Variable | Dev Default | Prod Default | Description |
|----------|-------------|--------------|-------------|
| `PORT` | `3000` | `3000` | Backend API port |
| `DB_HOST` | `postgres` | `postgres` | PostgreSQL Docker hostname |
| `DB_PORT` | `5432` | `5432` | PostgreSQL port |
| `DB_NAME` | `compliance_tower` | `compliance_tower` | Database name |
| `DB_USER` | `postgres` | `postgres` | Database user |
| `DB_PASSWORD` | `postgres` | `postgres` | Database password |
| `REDIS_HOST` | `redis` | `redis` | Redis Docker hostname |
| `REDIS_PORT` | `6379` | `6379` | Redis port |
| `JWT_SECRET` | `dev-secret-change-in-production` | `prod-secret-change-me` | Token signing secret |
| `CORS_ORIGIN` | `http://localhost:5173` | `http://localhost:5173` | Allowed CORS origin |
| `LOG_LEVEL` | `debug` | `info` | Logging level |

Override any variable inline:

```powershell
$env:JWT_SECRET="my-secret"; docker-compose up -d
```

Or edit the compose files directly.

---

## 10. Volumes & Data Persistence

PostgreSQL data is stored in a named Docker volume:

```powershell
docker volume ls  # Lists all volumes including postgres_data
```

The volume persists across restarts. To reset the database:

```powershell
docker-compose down -v   # -v deletes volumes
docker-compose up -d     # Fresh database + fresh migrations
```

---

## 11. Troubleshooting

| Problem | Solution |
|---------|----------|
| `Network needs to be recreated` | Run `docker-compose down` then `docker-compose up -d` |
| Container `ct-*` already exists | `docker rm -f ct-api ct-frontend ct-postgres ct-redis` then retry |
| API container keeps restarting | Check logs: `docker logs ct-api` |
| `host not found in upstream "api"` | Ensure the backend service is named `api` in docker-compose (not `backend`) |
| Frontend returns 502 | nginx cannot reach the API container — check `docker ps` for ct-api |
| Port 3000/5173/5432/6379 already in use | Stop the conflicting service or change the mapped port |
| `npm install` inside container fails | Try rebuilding without cache: `docker-compose build --no-cache api` |
| Migration fails | Check PostgreSQL connection details in docker-compose |
| Database tables missing | Run migrations manually: `docker exec ct-api node node_modules/tsx/dist/cli.mjs src/scripts/runMigrations.ts` |
| Login shows infinite spinner | Backend isn't running or API proxy is misconfigured. Check `http://localhost:3000/api/health` |
| Git push times out | Port 443 blocked by network — retry later |

---

## 12. CI/CD Pipeline

GitHub Actions workflow at `.github/workflows/ci.yml` runs on every push to `main` or `sprint-*` branches:

1. **Setup:** PostgreSQL + Redis service containers
2. **Migrate:** `runMigrations.ts` applies all `.sql` files
3. **Backend:** `tsc --noEmit` → `vitest run`
4. **Frontend:** `tsc --noEmit` → `vitest run` → `vite build`

---

## 13. File Reference

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Development stack (PostgreSQL + Redis + API + Frontend with volumes) |
| `docker-compose.prod.yml` | Production stack (PostgreSQL + Redis + API + Frontend with nginx) |
| `backend/Dockerfile` | Dev image: Node.js 20 + tsx watch |
| `backend/Dockerfile.prod` | Prod image: 2-stage (esbuild build → minimal runner) |
| `frontend/Dockerfile` | Dev image: Node.js 20 + Vite |
| `frontend/Dockerfile.prod` | Prod image: 2-stage (vite build → nginx) |
| `frontend/nginx.conf` | nginx config with `/api/` proxy to backend |
| `backend/src/scripts/runMigrations.ts` | Migration runner (compiled to JS for prod) |
| `backend/migrations/` | 29 SQL migration files (numbered, alphabetical order) |
| `SETUP.md` | This guide |
