# Compliance & Risk Control Tower — Installation Guide

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | >= 18 | Runtime |
| npm | >= 9 | Package manager |
| PostgreSQL | >= 14 | Database |
| Redis | >= 7 | BullMQ queues & caching |
| Docker (optional) | >= 24 | Containerized deployment |
| Docker Compose (optional) | >= 2.24 | Multi-service orchestration |

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

### 1. Clone & Install

```bash
git clone https://github.com/fayeztekitek/compliance-and-risk-control-tower.git
cd compliance-and-risk-control-tower
```

### 2. Environment Variables

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

### 3. Database Setup

Ensure PostgreSQL is running, then create the database:

```bash
createdb compliance_tower
```

### 4. Install Backend Dependencies

```bash
cd backend
npm install
```

### 5. Run Database Migrations

```bash
npm run migrate:up
```

This applies all migrations in sequence:

| Migration | Description |
|-----------|-------------|
| `000_init.sql` | Base tables, enums, extensions |
| `001_users_and_roles.sql` | Users table, roles enum, seed users |
| `002_veg_governance.sql` | VEG requests, opportunities, contracts |
| `003_security_vulnerabilities.sql` | Vulnerabilities, waivers, risk acceptances, SLA |
| `004_projects_roadmaps.sql` | Projects, roadmaps, RTD submissions |
| `005_saas_privacy.sql` | SaaS applications, data processing inventory |
| `006_audits_committees.sql` | Audits, findings, CAPA, obligations, committees |
| `007_kpi_snapshots.sql` | KPI snapshot archive table |
| `008_nexus_ingestion.sql` | Nexus IQ products, vulns, waivers, sync logs |
| `009_seed_data.sql` | Seed data for demo and testing |

Each migration has a corresponding `_down.sql` for rollback:

```bash
npm run migrate:down
```

### 6. Start the Backend

```bash
npm run dev
```

The API starts at http://localhost:3000.

- Health check: http://localhost:3000/api/health
- API docs (Swagger UI): http://localhost:3000/api/docs

### 7. Install & Start the Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend starts at http://localhost:5173.

---

## Production Deployment

### Using Docker Compose (Production)

```bash
# Set required environment variables
export DB_PASSWORD=your-strong-password
export JWT_SECRET=your-long-random-secret
export CORS_ORIGIN=https://your-domain.com
export API_URL=https://api.your-domain.com

# Start with production config
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Manual Production Build

```bash
# Build backend
cd backend
npm run build
NODE_ENV=production node dist/index.js
```

```bash
# Build frontend
cd frontend
npm run build
# Serve the dist/ folder via nginx or similar
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

### Backend Tests

```bash
cd backend
npm test                    # All tests
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
```

Tests that require a live database are automatically skipped via the `healthCheck()` guard.

### Frontend Tests

```bash
cd frontend
npm test                    # Vitest unit tests
npm run test:e2e            # Playwright E2E tests (requires running server)
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

### "Cannot find module" errors
The `&` character in the project directory name (`compliance-&-risk-control-tower`) can break npm script resolution on Windows PowerShell. Use direct paths instead:

```powershell
# Instead of: npm test
node node_modules\vitest\vitest.mjs run
```

### Database connection refused
Ensure PostgreSQL is running and the credentials in `.env` are correct.

### Redis connection refused
Ensure Redis is running. If you don't need BullMQ functionality, queue operations will log errors but the API will still function.

### Port already in use
Change `PORT` in `.env` or stop the process occupying the port.

### Git push timeout
If `git push` times out on port 443, retry — the connection is intermittent on some networks.
