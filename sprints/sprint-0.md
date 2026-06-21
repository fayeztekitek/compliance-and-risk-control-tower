# Sprint 0: Foundation & Infrastructure

**Duration:** 2 weeks
**Goal:** Set up project structure, database schemas, Docker Compose, CI/CD pipeline.

---

## Tasks

### Backend Scaffolding
- [ ] Create `backend/` directory structure (routes, services, repositories, middleware)
- [ ] Set up Express + TypeScript with live reload (tsx)
- [ ] Configure Pino logger with JSON output
- [ ] Add Helmet, CORS, rate-limiting middleware
- [ ] Create PostgreSQL connection pool with `node-postgres`
- [ ] Set up `node-pg-migrate` for database migrations

### Database Schema (PostgreSQL)
- [ ] `001_users_and_roles.sql` — users table, roles enum
- [ ] `002_veg_governance.sql` — VEG requests, opportunities, contracts
- [ ] `003_security_vulnerabilities.sql` — vulnerabilities, waivers, risk acceptances, SLA incidents
- [ ] `004_projects_roadmaps.sql` — projects, roadmaps, RTD reviews
- [ ] `005_saas_privacy.sql` — SaaS applications, privacy assessments, data processing inventory
- [ ] `006_audits_committees.sql` — audits, findings, corrective actions, evidence, committees, decisions
- [ ] `007_kpi_snapshots.sql` — KPI snapshots, KRI records
- [ ] `008_nexus_ingestion.sql` — Nexus IQ products, applications, scans, components, violations, waivers
- [ ] `009_seed_data.sql` — seed from existing `mockData.ts` and `realVegRequests.ts`

### Docker & Infrastructure
- [ ] `Dockerfile` — multi-stage build (backend)
- [ ] `Dockerfile` — multi-stage build (frontend)
- [ ] `docker-compose.yml` — postgres, redis, api
- [ ] `docker-compose.prod.yml` — production overrides
- [ ] Health check endpoint: `GET /api/health`

### CI/CD (GitHub Actions)
- [ ] `.github/workflows/ci.yml` — lint → typecheck → test → build

### Frontend Scaffolding
- [ ] Set up React Router v7 with all routes
- [ ] Configure TanStack Query provider
- [ ] Configure Zustand store for UI state
- [ ] Set up Vitest + Testing Library
- [ ] Create `api/client.ts` — Axios instance with auth interceptor

---

## Deliverables

- [ ] `docker compose up` starts all services
- [ ] Database health check passes
- [ ] CI pipeline passes lint/typecheck/test/build
- [ ] Frontend dev server launches on port 5173
- [ ] Backend dev server launches on port 3000

---

## Tests

| Type | Count | Description |
|------|-------|-------------|
| Unit | 4 | DB pool init, migration order, logger masking, health check |
| Integration | 2 | Health endpoint, Docker compose connectivity |
| Functional | 2 | Full startup sequence, migration rollback |
