# Compliance & Risk Control Tower — Installation Guide

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | >= 20 | Runtime |
| npm | >= 9 | Package manager |
| Docker | >= 24 | PostgreSQL & Redis containers |

---

## Quick Start (Docker)

The fastest way to get the full stack running:

```bash
# Clone the repository
git clone https://github.com/fayeztekitek/compliance-and-risk-control-tower.git
cd compliance-and-risk-control-tower

# Copy environment file
cp .env.example .env

# Start all services
docker compose up
```

This starts:
- **PostgreSQL** on port 5432 (with migrations auto-applied)
- **Redis** on port 6379
- **Backend API** on port 3000
- **Frontend** on port 5173

Visit http://localhost:5173 and log in with `fayez.tekitek@vermeg.com` / `admin123!`.

---

## Manual Setup

### 1. Start PostgreSQL & Redis (Docker)

```powershell
# Create & start containers (first time)
docker run -d --name ct-postgres -e POSTGRES_DB=compliance_tower -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16
docker run -d --name ct-redis -p 6379:6379 redis:7

# After first time, just start them:
docker start ct-postgres ct-redis
```

### 2. Clone & Install

```bash
git clone https://github.com/fayeztekitek/compliance-and-risk-control-tower.git
cd compliance-and-risk-control-tower

### 3. Environment Variables

Copy the example env file:

Copy the example env file and adjust as needed:

```bash
cp .env.example .env
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
| `VITE_API_URL` | `http://localhost:3000` | Frontend API target |

### 4. Install Backend Dependencies

```powershell
cd backend
npm install
```

### 5. Run Database Migrations

> **Important:** The project uses raw `.sql` migration files, not `node-pg-migrate`. There is no `npm run migrate:up` script.

```powershell
node node_modules/tsx/dist/cli.mjs src/scripts/runMigrations.ts
```

This applies all `.sql` files from `backend/migrations/` in alphabetical order, tracking already-run files in the `pgmigrations` table.

| Migration | File | Description |
|-----------|------|-------------|
| 000–009 | `00*_*.sql` | Base tables, users, VEG, security, projects, SaaS, audits, KPI, Nexus, seeds |
| 010–019 | `01*_*.sql` | Unified findings, SLA tracking, roadmaps, compliance frameworks, RBAC |
| 020–029 | `02*_*.sql` | VEG deals, multi-scanner, archive, alert rules |

The database `compliance_tower` is created automatically by Docker — no manual `createdb` needed.

### 6. Start the Backend

> **Windows note:** The `&` in the project directory name (`compliance-&-risk-control-tower`) breaks `npm run dev`. Use the direct path:

```powershell
node node_modules/tsx/dist/cli.mjs src/index.ts
```

The API starts at http://localhost:3000. Seed data (users, deals, vulnerabilities) is inserted automatically on first startup.

- Health check: http://localhost:3000/api/health
- API docs (Swagger UI): http://localhost:3000/api/docs

### 7. Install & Start the Frontend

In a separate terminal:

```powershell
cd frontend
npm install
node node_modules/vite/bin/vite.js --port 5173
```

The frontend starts at http://localhost:5173.

> The Vite dev server proxies `/api` requests to `http://localhost:3000` (configured in `vite.config.ts`), so the frontend works without CORS issues.

---

## Production Deployment

### Using Docker Compose

```powershell
# Start all services
docker compose up -d

# Stop
docker compose down
```

### Manual Production Build

```powershell
# Build frontend
cd frontend
node node_modules/vite/bin/vite.js build

# Serve backend in production mode
cd backend
$env:NODE_ENV="production"
node node_modules/tsx/dist/cli.mjs src/index.ts
```

### Environment Variables for Production

**.env file:**

```env
NODE_ENV=production
PORT=3000
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=compliance_tower
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_POOL_MAX=20
DB_IDLE_TIMEOUT=30000
REDIS_HOST=your-redis-host
REDIS_PORT=6379
JWT_SECRET=your-long-random-secret-at-least-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=https://your-frontend-domain.com
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
LOG_LEVEL=info
VITE_API_URL=https://api.your-domain.com
```

---

## Running Tests

### Backend Tests (227 tests)

```powershell
cd backend
node node_modules/vitest/vitest.mjs run

# Run a specific test file:
node node_modules/vitest/vitest.mjs run tests/unit/auth.service.test.ts
```

Tests that require a live database are automatically guarded by a `healthCheck()`.

### Frontend Tests (24 tests)

```powershell
cd frontend
node node_modules/vitest/vitest.mjs run
```

### E2E Tests (Playwright)

Requires both backend (`:3000`) and frontend (`:5173`) running:

```powershell
cd frontend
node node_modules/playwright/cli.mjs test
```

### Generate API Types from OpenAPI Spec

```bash
cd frontend
npm run generate-api-types
```

---

## Architecture Diagram

```
┌──────────────┐     ┌──────────────┐
│   Frontend   │     │   Backend    │
│  (Vite+React)│────▶│  (Express)   │
│  :5173       │     │  :3000       │
└──────────────┘     └──────┬───────┘
                            │
                    ┌───────┴───────┐
                    │   PostgreSQL  │
                    │   :5432       │
                    └───────┬───────┘
                            │
                    ┌───────┴───────┐
                    │    Redis      │
                    │   :6379       │
                    └───────────────┘
```

---

## Troubleshooting

### "Cannot find module" or npm scripts fail
The `&` character in `compliance-&-risk-control-tower` breaks npm script resolution on Windows PowerShell. Use direct paths:

```powershell
# Instead of: npm test
node node_modules\vitest\vitest.mjs run

# Instead of: npm run dev
node node_modules\tsx\dist\cli.mjs src\index.ts
```

### Port already in use (3000, 5173, 5432, 6379)
```powershell
# Find what's using the port
netstat -ano | Select-String ":3000"

# Kill the process (replace PID)
Stop-Process -Id <PID> -Force
```

### Login page shows infinite spinner
1. Check the browser console (F12) for API errors
2. Verify the backend is running: `curl http://localhost:3000/api/health`
3. Check the Vite proxy: frontend on 5173 proxies `/api` to `:3000`
4. If Vite started on a port other than 5173 (e.g., 5174, 5175), use `--port 5173` explicitly

### Database connection refused
```powershell
docker ps                    # Check containers are running
docker logs ct-postgres      # Check PostgreSQL logs
```

### Redis connection refused
BullMQ queues will log errors but the API still works. Verify:
```powershell
docker ps | Select-String redis
```
