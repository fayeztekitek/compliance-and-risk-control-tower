# Compliance & Risk Control Tower

A centralized governance platform for managing compliance, risk, security vulnerabilities, vendor governance, project delivery, SaaS lifecycle, audits, and executive oversight — replacing siloed spreadsheets with a unified control tower.

---

## Quick Start

### Prerequisites

- Node.js 20+
- Docker (PostgreSQL 16 + Redis 7 containers)
- npm or yarn

### Start Services

```bash
# 1. Start database and cache
docker run -d --name ct-postgres -e POSTGRES_DB=compliance_tower -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16
docker run -d --name ct-redis -p 6379:6379 redis:7

# 2. Backend
cd backend
npm install
npm run migrate:up
npm run dev          # http://localhost:3000 — Swagger at /api/docs

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev          # http://localhost:5173
```

### Seed Data

The backend auto-seeds on first startup:
- **7 RBAC users** — default admin: `fayez.tekitek@vermeg.com` / `admin123!`
- **VEG deal register** — 2037 committee-reviewed deals
- **Security findings** — sample vulnerabilities with waivers and risk acceptances
- **Roadmaps & projects** — reference data for dashboard KPIs

### Production Deployment

```bash
# Build frontend
cd frontend && npm run build  # output: dist/

# Start backend in production mode
cd backend && NODE_ENV=production node node_modules/tsx/dist/cli.mjs src/index.ts

# Or use PM2:
npm install -g pm2
pm2 start node node_modules/tsx/dist/cli.mjs --name ctrl-tower -- src/index.ts
```

---

## Documentation

| Document | Audience | Description |
|----------|----------|-------------|
| [User Guide](./docs/user-guide.md) | Business users | How to use the platform, features by role |
| [Installation Guide](./docs/installation.md) | Developers/DevOps | Setup, configuration, deployment |
| [Design Document](./docs/design.md) | Architects/Developers | Architecture, technology choices, data model |
| [API Reference](./docs/api.md) | Developers | Endpoint reference, authentication, rate limits |
| Swagger UI | Developers | Interactive API docs at `/api/docs` |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS 4 |
| Backend | Express 4, TypeScript, Zod, Pino |
| Database | PostgreSQL 16 + Redis 7 |
| Testing | Vitest, Supertest, Playwright |
| Infrastructure | Docker, Docker Compose, GitHub Actions |

---

## Architecture

```
Frontend (React) ── HTTP ──▶ Backend (Express) ──▶ PostgreSQL + Redis
```

- **7-role RBAC** — ADMIN, COMPLIANCE_OFFICER, RISK_MANAGER, SECURITY_MANAGER, PRODUCT_OWNER, AUDITOR, EXECUTIVE_READ_ONLY
- **~70 API endpoints** across auth, VEG, security, projects, nexus, dashboard, export
- **16 KPIs + 4 KRIs** with 8-factor risk scoring and 5x5 heatmap
- **BullMQ background jobs** for SLA breach detection, waiver expiry, Nexus sync
- **OpenAPI 3.0** documentation with Swagger UI

---

## Test Results

**~192 tests passing** across 28 backend + 4 frontend files:

| Category | Tests | Location |
|----------|-------|----------|
| Backend Unit | ~120 | `backend/tests/unit/` (17 files) |
| Backend Integration | ~38 | `backend/tests/integration/` (7 files) |
| Backend Functional | ~10 | `backend/tests/functional/` (5 files) |
| Frontend | 24 | `frontend/tests/` (4 files) |

> **Note:** 2 pre-existing test failures in `security.functional.test.ts` (use old `vulnerabilities` table — bypasses unified_findings).

---

## Key Features

- **Executive Dashboard** — 16 KPI cards, 4 KRI thresholds, 5x5 heatmap, monthly trends
- **VEG Governance** — Deal pipeline with department sign-offs, bid/gonogo decisions
- **Security Governance** — Vulnerability registry, waivers, risk acceptances, SLA tracking
- **Nexus IQ Integration** — Software supply chain risk scoring (8-factor model)
- **Project Oversight** — Roadmaps, RTD tracking, go-live readiness
- **SaaS Governance** — Lifecycle management, privacy by design, GDPR compliance
- **Audit Management** — Findings, CAPA, contractual obligations
- **Committees** — Meeting management with agenda and decisions
- **CSV/PDF Export** — Download KPI data for reporting
- **Rate Limiting** — 100 req/min global, 10 req/min auth
- **Graceful Shutdown** — SIGTERM/SIGINT drains connections

---

## License

Proprietary — VERMEG Internal Use
