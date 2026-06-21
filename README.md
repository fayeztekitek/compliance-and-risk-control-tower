# Compliance & Risk Control Tower

A centralized governance platform for managing compliance, risk, security vulnerabilities, vendor governance, project delivery, SaaS lifecycle, audits, and executive oversight — replacing siloed spreadsheets with a unified control tower.

---

## Quick Start

```bash
# Start all services
docker compose up

# Or manually:
cd backend && npm install && npm run migrate:up && npm run dev
cd frontend && npm install && npm run dev
```

Then open http://localhost:5173 and log in with:

> **Email:** `fayez.tekitek@vermeg.com`  
> **Password:** `admin123!`

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

**143 tests passing** across 22 files:

| Category | Tests |
|----------|-------|
| Unit tests | ~110 |
| Integration tests | ~28 |
| Functional tests | ~8 |
| E2E tests | 4 |

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
