# Compliance & Risk Control Tower — Installation & Deployment Guide

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | >= 20 | Runtime for backend & frontend |
| npm | >= 9 | Package manager |
| Docker | >= 24 | PostgreSQL 16 & Redis 7 containers |
| Git | >= 2 | Version control |

---

## 1. Getting the Code

```bash
git clone https://github.com/fayeztekitek/compliance-and-risk-control-tower.git
cd compliance-and-risk-control-tower
```

> **Windows note:** The `&` in the directory name breaks `npm run` scripts. Always use direct `node node_modules/...` paths instead of npm scripts.

---

## 2. Environment Variables

Copy the example file:

```powershell
copy .env.example .env
```

Key variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Backend API port |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `compliance_tower` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `postgres` | Database password |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `JWT_SECRET` | *(change in production)* | Token signing secret |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |

---

## 3. Starting Database & Cache

```powershell
# First time — create containers
docker run -d --name ct-postgres -e POSTGRES_DB=compliance_tower -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16
docker run -d --name ct-redis -p 6379:6379 redis:7

# Subsequent starts
docker start ct-postgres ct-redis

# Verify
docker ps
```

---

## 4. Starting the Backend

```powershell
cd backend
npm install

# Apply database migrations (creates all tables + seed data)
node node_modules/tsx/dist/cli.mjs src/scripts/runMigrations.ts

# Start the API server
node node_modules/tsx/dist/cli.mjs src/index.ts
```

The backend starts on **http://localhost:3000**.

| Endpoint | Description |
|----------|-------------|
| `http://localhost:3000/api/health` | Health check |
| `http://localhost:3000/api/docs` | Swagger UI (API documentation) |

Migrations are raw `.sql` files in `backend/migrations/` applied alphabetically. Already-run migrations are tracked in the `pgmigrations` table.

---

## 5. Starting the Frontend

Open a **second terminal**:

```powershell
cd frontend
npm install
node node_modules/vite/bin/vite.js --port 5173
```

The frontend starts on **http://localhost:5173**.

> The Vite dev server proxies `/api` requests to `http://localhost:3000` (configured in `vite.config.ts`), so all API calls work without CORS configuration.

---

## 6. Login

Open http://localhost:5173 in your browser.

| Role | Email | Password |
|------|-------|----------|
| Admin | `fayez.tekitek@vermeg.com` | `admin123!` |
| Compliance Officer | `compliance@vermeg.com` | `admin123!` |
| Risk Manager | `risk.manager@vermeg.com` | `admin123!` |
| Security Manager | `security.manager@vermeg.com` | `admin123!` |
| Product Owner | `product.owner@vermeg.com` | `admin123!` |
| Auditor | `auditor@vermeg.com` | `admin123!` |
| Executive Read Only | `executive@vermeg.com` | `admin123!` |

---

## 7. Running Tests

```powershell
# Backend (227 tests)
cd backend
node node_modules/vitest/vitest.mjs run

# Frontend (24 tests)
cd frontend
node node_modules/vitest/vitest.mjs run

# Run specific backend test
cd backend
node node_modules/vitest/vitest.mjs run tests/unit/auth.service.test.ts
```

---

## 8. Production Deployment

### Build Frontend

```powershell
cd frontend
node node_modules/vite/bin/vite.js build
```

Output goes to `frontend/dist/` — serve with nginx, IIS, or any static server.

### Run Backend in Production

```powershell
cd backend
$env:NODE_ENV="production"
node node_modules/tsx/dist/cli.mjs src/index.ts
```

### Using Docker Compose

```powershell
# Start everything (PostgreSQL + Redis + Backend)
docker compose up -d

# Stop
docker compose down
```

### Production Checklist

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Set `DB_PASSWORD` to a strong password
- [ ] Set `CORS_ORIGIN` to your frontend domain
- [ ] Use `LOG_LEVEL=info` (default is `debug`)
- [ ] Configure SMTP for email alerts (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`)
- [ ] Configure Slack webhook for alerts (`SLACK_WEBHOOK_URL`)

---

## 9. Architecture Overview

```
Browser ── :5173 ──▶ Vite Proxy ── :3000 ──▶ Express API
                        │                       │
                        │                 ┌─────┴──────┐
                        │           PostgreSQL 16   Redis 7
                        │                 :5432       :6379
                        │
                   Static files
                   (production)
```

---

## 10. Troubleshooting

| Problem | Solution |
|---------|----------|
| `npm run dev` fails | Use `node node_modules/tsx/dist/cli.mjs` directly — the `&` in the folder name breaks npm scripts |
| Backend won't start (EADDRINUSE) | Port 3000 is taken — kill the old process: `Stop-Process -Id (netstat -ano | Select-String ':3000 ' | ForEach-Object { $_ -replace '.*\s+(\d+)$', '$1' }) -Force` |
| Frontend starts on wrong port | Old Vite instance is occupying 5173 — kill it or use `--port 5173` explicitly |
| Login shows infinite spinner | Backend isn't running or Vite proxy is misconfigured. Check `http://localhost:3000/api/health` |
| Database connection refused | PostgreSQL container isn't running: `docker start ct-postgres` |
| Redis connection refused | Redis container isn't running: `docker start ct-redis`. API still works without Redis (queues log errors) |
| Git push times out | Network issue — retry later |
| Tests fail with DB errors | Run migrations first: `node node_modules/tsx/dist/cli.mjs src/scripts/runMigrations.ts` |

---

## 11. CI/CD Pipeline

GitHub Actions workflow at `.github/workflows/ci.yml` runs on every push to `main` or `sprint-*` branches:

1. **Setup:** PostgreSQL + Redis service containers
2. **Migrate:** `runMigrations.ts` applies all `.sql` files
3. **Backend:** `tsc --noEmit` → `vitest run`
4. **Frontend:** `tsc --noEmit` → `vitest run` → `vite build`
