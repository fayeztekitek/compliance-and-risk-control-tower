# Compliance & Risk Control Tower — Production Architecture & Implementation Plan

---

## 1. Current Architecture Critique

| Area | Current State | Problem | Impact |
|------|--------------|---------|--------|
| **Data Storage** | All CRUD in `localStorage` via a monolithic 885-line store | No persistence across devices, no data integrity, no transactions | Data loss on cache clear, no multi-user support |
| **Backend** | Express server only for Nexus IQ mock proxy; core domain has no backend | Business logic mixed with UI, no API contracts, no auth | Cannot scale, no real API for external consumption |
| **Authentication** | Persona switcher in localStorage | No real auth, any user can assume any role | No security — completely production-blocking |
| **State Management** | `complianceStore.ts` — god object pattern | No separation of concerns, no caching, no reactivity optimization | Impossible to test, hard to maintain |
| **API Layer** | Direct `localStorage.get/set` calls from React components | No abstraction, no error handling, no request/response validation | UI tightly coupled to storage |
| **Error Handling** | Bare try/catch in `syncWithPortal` and `NexusApiClient` | No centralized error handling, no logging framework | Silent failures, hard to debug |
| **Testing** | None (no test files, no test framework) | No CI/CD pipeline, no regression safety | Cannot deploy with confidence |
| **Validation** | No schema validation anywhere | Malformed data can enter localStorage | Data corruption |
| **Monitoring** | Only `console.log` statements | No structured logging, no metrics, no alerts | Blind in production |
| **Deployment** | `tsx server.ts` in dev, `vite build + esbuild` for prod | No containerization, no orchestrator, no CI/CD | Manual deployment, no rollback |
| **Nexus IQ Client** | `NexusApiClient` with mock fallback | Simulated data mixed with real API calls | No separation between mock and real data sources |
| **Database Schema** | `nexus_schema.sql` exists but unused | Only for Nexus IQ, missing core domain tables (Users, VEG, Projects, etc.) | Relational model incomplete |

---

## 2. New Production Architecture Design

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER (React SPA)                     │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────────────┐ │
│  │    Pages        │  │  Components  │  │  Hooks & Context        │ │
│  │  (Router)       │  │  (UI Kit)    │  │  useQuery/useMutation   │ │
│  └───────┬────────┘  └──────┬───────┘  └───────────┬─────────────┘ │
│          │                  │                       │               │
│  ┌───────┴──────────────────┴───────────────────────┴─────────────┐ │
│  │              API Client Layer (TanStack Query)                  │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │ │
│  │  │ Auth API │  │ VEG API  │  │ Vuln API │  │ Nexus IQ API │   │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTPS / REST + JWT
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (Express / NGINX)                   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     BACKEND LAYER (Express + Node.js)                │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    ROUTES / CONTROLLERS                        │ │
│  │  /api/auth  /api/veg  /api/security  /api/projects             │ │
│  │  /api/saas  /api/audits  /api/committees  /api/nexus          │ │
│  └─────────────────────────┬──────────────────────────────────────┘ │
│                            │                                        │
│  ┌─────────────────────────┴──────────────────────────────────────┐ │
│  │                    SERVICE LAYER                               │ │
│  │  AuthService │ VEGService │ SecurityService │ ProjectService   │ │
│  │  SaaSGovernanceService │ AuditService │ KPIEngineService      │ │
│  │  NexusSyncService │ RiskScoreService │ CommitteeService       │ │
│  └─────────────────────────┬──────────────────────────────────────┘ │
│                            │                                        │
│  ┌─────────────────────────┴──────────────────────────────────────┐ │
│  │                  DATA ACCESS LAYER (Repositories)               │ │
│  │  UserRepo │ VEGRepo │ VulnRepo │ WaiverRepo │ ProjectRepo      │ │
│  │  SaasAppRepo │ AuditRepo │ CommitteeRepo │ KpiSnapshotRepo    │ │
│  │  NexusProductRepo │ ContractRepo                               │ │
│  └─────────────────────────┬──────────────────────────────────────┘ │
│                            │                                        │
│  ┌─────────────────────────┴──────────────────────────────────────┐ │
│  │                    INFRASTRUCTURE LAYER                         │ │
│  │  DB Connection Pool │ Cache (Redis) │ Logger (Winston/Pino)    │ │
│  │  Queue (Bull/BullMQ) │ Rate Limiter │ Health Check             │ │
│  └────────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
    ┌──────────────────┐      ┌──────────────────────┐
    │   PostgreSQL      │      │   Redis (Cache/Queue) │
    │   (Primary DB)    │      │                      │
    │                   │      │   - Session store    │
    │   - Core domain   │      │   - Rate limiting    │
    │   - Nexus IQ      │      │   - Background jobs  │
    │     schema        │      │   - KPI cache        │
    └──────────────────┘      └──────────────────────┘
```

---

## 3. Technology Stack

### Frontend
| Technology | Purpose | Why |
|-----------|---------|-----|
| **React 19** | UI framework | Already used, mature ecosystem |
| **TypeScript 5** | Type safety | Already used |
| **Vite 6** | Build tool | Already used, fast HMR |
| **Tailwind CSS 4** | Styling | Already used |
| **TanStack Query v5** | Server state & caching | Replaces localStorage pattern with proper API caching, auto refetch, optimistic updates |
| **Zustand** | Client state (UI only) | Lightweight, no boilerplate, replaces god object store |
| **React Router v7** | Routing | Proper URL-based routing vs current manual state-based switching |
| **Recharts** | Charts | Already used |
| **React Hook Form + Zod** | Form validation | Schema-based form validation for VEG, audit findings, etc. |
| **Lucide React** | Icons | Already used |
| **Vitest + Testing Library** | Testing | Fast, Vite-native test runner |

### Backend
| Technology | Purpose | Why |
|-----------|---------|-----|
| **Express 4** | HTTP server | Already used, widely known |
| **TypeScript 5** | Type safety | Already used |
| **tsx** | Dev execution | Already used |
| **Zod** | Request validation | Schema-based validation for all API inputs |
| **Helmet** | Security headers | Production security baseline |
| **CORS** | Cross-origin config | Required for separated frontend/backend |
| **Pino** | Structured logging | JSON logging, low overhead, transportable to ELK/Datadog |
| **BullMQ** | Background jobs | Nexus IQ sync, KPI recalculations, email notifications |
| **ioredis** | Redis client | Session store, cache, queue backend |
| **bcrypt + jsonwebtoken** | Auth | Industry-standard password hashing and JWT |
| **node-postgres** | Database driver | Native PostgreSQL client with connection pooling |

### Database
| Technology | Purpose |
|-----------|---------|
| **PostgreSQL 16** | Primary relational database |
| **Redishash** | Cache & session store |
| **Flyway / node-pg-migrate** | Database migrations |

### DevOps
| Technology | Purpose |
|-----------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Local dev orchestration |
| **GitHub Actions** | CI/CD pipeline |
| **ESLint + Prettier** | Code quality |

---

## 4. Sprint Plan

### Sprint 0: Foundation & Infrastructure (2 weeks)

**Goal:** Set up project structure, database schemas, Docker Compose, CI/CD pipeline.

```
Backend:
  - Scaffold Express project with TypeScript (src/server.ts → backend/)
  - Set up folder structure: routes/, services/, repositories/, middleware/
  - Configure Pino logger, Helmet, CORS, rate limiting
  - Create PostgreSQL connection pool with node-postgres
  - Write Dockerfile + docker-compose.yml (postgres, redis, api)
  - Create database migration framework (node-pg-migrate)
  - Write SQL migrations for ALL tables:
    • users + roles
    • veg_requests + opportunities + contracts
    • vulnerabilities + waivers + risk_acceptances + sla_incidents
    • projects + roadmaps + rtd_reviews
    • saas_applications + privacy_assessments + data_processing_inventory
    • audits + audit_findings + corrective_actions + evidence
    • committees + committee_decisions
    • contractual_obligations
    • audit_trails + notifications
    • kpi_snapshots + kri_records
    • nexus_* (from existing nexus_schema.sql)
  - Set up GitHub Actions CI: lint → typecheck → test → build

Frontend:
  - Scaffold proper frontend project structure
  - Set up React Router (routes: /dashboard, /veg, /security, /nexus, /roadmaps, /saas, /audits, /committees, /admin)
  - Configure TanStack Query provider
  - Configure Zustand store for UI state (sidebar open, current view, theme)
  - Set up Vitest + Testing Library

Tests:
  - [Unit] Database connection pool initialization
  - [Unit] Migration runner executes in correct order
  - [Unit] Logger masking (secrets redaction)
  - [Functional] Docker Compose brings up all services
  - [Functional] Health check endpoint returns 200
```

### Sprint 1: Authentication & Authorization (2 weeks)

**Goal:** Real JWT-based auth with 7 roles, login/session management.

```
Backend:
  - POST /api/auth/register — create user with hashed password
  - POST /api/auth/login — validate credentials, return JWT + refresh token
  - POST /api/auth/refresh — rotate tokens
  - POST /api/auth/logout — invalidate session
  - GET /api/auth/me — current user profile
  - Auth middleware: verify JWT, attach user to request
  - RBAC middleware: check required role + permission
  - Seed migration for 7 default users (from MOCK_USERS)

Frontend:
  - Login page (/login) with email/password form
  - Auth context + useAuth hook (token storage, auto-refresh)
  - ProtectedRoute component with role gating
  - Role-based sidebar (replace current persona switcher)
  - Logout flow

Tests:
  - [Unit] Password hashing rounds === 12
  - [Unit] JWT token generation and verification
  - [Unit] RBAC middleware rejects unauthorized roles
  - [Unit] Auth middleware rejects expired tokens
  - [Integration] POST /api/auth/login returns tokens
  - [Integration] GET /api/auth/me returns 401 without token
  - [Functional] Login → access protected route → logout → access rejected
```

### Sprint 2: Core API — VEG Governance (2 weeks)

**Goal:** Full CRUD API for VEG requests + opportunities + contracts.

```
Backend:
  - VEGService: create, read, update, delete, list with filters
  - VEG validation schemas (Zod):
    • title: min 3, max 255
    • marginEstimate: 0-100
    • workloadMD: positive integer
    • type: enum [RFI, RFP, ...]
    • status transitions: DRAFT→SUBMITTED→APPROVED/REJECTED→CONTRACT_SIGNATURE
  - Multi-department sign-off state machine (financeState, salesState, etc.)
  - Bid/No-Bid + Go/No-Go decision endpoints
  - Batch update from CRM sync endpoint
  - Opportunity + Contract CRUD (nested under VEG)

Frontend:
  - Replace localStorage VEG calls with TanStack Query hooks
  - VEG list page with pagination, search, filters
  - VEG detail side panel with full data
  - VEG form (create/edit) with React Hook Form + Zod validation
  - Department sign-off UI (colored indicators, click-to-approve)
  - Bid/Go decision buttons
  - Excel/CRM sync portal with diff view
  - Real data: seed 70+ real VEG requests via migration

Tests:
  - [Unit] VEG status transition validator (valid/invalid paths)
  - [Unit] Department sign-off state machine logic
  - [Unit] VEG Zod schema catches invalid margin/type/title
  - [Integration] GET /api/veg returns paginated results
  - [Integration] POST /api/veg creates with validation
  - [Integration] PATCH /api/veg/:id updates department state
  - [Integration] Batch update syncs correctly
  - [Functional] Create VEG → add department signs → approve → contract signed
  - [Functional] CRM sync shows diff and applies batch changes
```

### Sprint 3: Core API — Security & Vulnerability Governance (2 weeks)

**Goal:** Full CRUD for vulnerabilities, waivers, risk acceptances, SLA incidents.

```
Backend:
  - SecurityService: CRUD for vulnerabilities, waivers, risk acceptances, SLA incidents
  - Vulnerability validation: severity enum, SLA date future, scanner enum
  - Waiver approval state machine (PENDING→APPROVED/REJECTED→EXPIRED)
  - Waiver auto-expire check on read (cron job via BullMQ)
  - Risk acceptance + mitigation plan storage
  - False positive toggle with mandatory explanation
  - SLA breach detection logic
  - Scan import: parse Veracode/SonarQube/Fortify CSV/Excel
  - DevOps-Sec portal sync endpoint (POST /api/security/sync/portal)
  - POST /api/security/import/scan — multipart file upload + parse

Frontend:
  - Vulnerability registry with filters (severity, scanner, status, product)
  - Waiver request/approve/reject UI
  - Risk acceptance form with business impact + mitigation plan
  - False positive toggle with explanation modal
  - SLA breach dashboard with overdue highlighting
  - Scan upload UI with file picker + parse preview

Tests:
  - [Unit] SLA breach calculation (anchor date logic)
  - [Unit] Waiver status transition (PENDING→APPROVED, expired auto-set)
  - [Unit] False positive toggling creates audit trail
  - [Unit] Scan CSV parser correctness
  - [Integration] POST /api/security/vulnerabilities creates with validation
  - [Integration] POST /api/security/waivers creates and links to vuln
  - [Integration] Waiver approval updates vulnerability status
  - [Integration] POST /api/security/import/scan parses file
  - [Functional] Create vuln → request waiver → approve → verify vuln status changed
  - [Functional] Upload scan file → see parsed results in registry
```

### Sprint 4: Core API — Projects, Roadmaps, SaaS, Audits (2 weeks)

**Goal:** CRUD APIs for remaining 4 workstreams.

```
Backend:
  - ProjectService: CRUD + RTD declaration + budget/slippage tracking
  - RoadmapService: CRUD + milestone status tracking
  - KPIEngineService: real-time KPI calculation from raw data (replaces current calculateKPIs)
  - SaaSGovernanceService: lifecycle state machine, GDPR checklist, privacy assessment
  - AuditService: audit + finding + corrective action + evidence CRUD
  - ContractualObligationService: compliance verification tracking
  - CommitteeService: scheduling, agenda, minutes, decisions

Frontend:
  - Roadmaps & Projects workspace with RTD deviation charts
  - SaaS Governance workspace with lifecycle stages + GDPR checklist
  - Audits & Contracts workspace with CAPA center
  - Committees workspace with agenda builder + minutes editor
  - Administration workspace with audit trail viewer + user management

Tests:
  - [Unit] RTD deviation calculation
  - [Unit] SaaS lifecycle state machine (ONBOARDING→GO_LIVE→OFFBOARDING)
  - [Unit] KPI engine aggregation formulas match existing 16 KPIs
  - [Unit] Audit finding → corrective action linkage
  - [Unit] Committee decision validation (APPROVED/REJECTED/DEFERRED)
  - [Integration] CRUD for all 4 workstreams
  - [Integration] KPI endpoint returns correct aggregated values
  - [Functional] Full SaaS lifecycle: onboard → checklist → go-live → offboard
  - [Functional] Audit cycle: create audit → add findings → assign CAPAs → close
```

### Sprint 5: Executive Dashboard & KPI Engine (2 weeks)

**Goal:** Production dashboard with real-time data, 5×5 heatmap, export.

```
Backend:
  - GET /api/dashboard/executive — consolidated dashboard payload
  - GET /api/dashboard/kpi — 16 real-time KPI calculations
  - GET /api/dashboard/kri — KRI thresholds monitoring
  - GET /api/dashboard/heatmap — 5×5 risk matrix data
  - GET /api/dashboard/trends — historical KPI snapshots (monthly aggregation)
  - BullMQ job: recalculate KPIs every 15 minutes + cache in Redis
  - BullMQ job: archive historical KPI snapshots daily
  - GET /api/export/csv — CSV export of any filtered dataset
  - GET /api/export/pdf — audit report generation (PDFKit or Puppeteer)

Frontend:
  - Dashboard with live data from TanStack Query (auto-refresh 60s)
  - KPI card grid (16 cards with status colors, trend arrows)
  - 5×5 heatmap with cell drill-down (existing implementation → hook-based)
  - Scanner suite bar chart
  - Chronos RTD area chart
  - KRI financial breach limits panel
  - "Yesterday's Pending Items" panel (existing → data-driven)
  - Export buttons (CSV, PDF)
  - Conditional formatting: role-based visibility of certain KPIs

Tests:
  - [Unit] KPI engine matches pre-calculated expected values
  - [Unit] KRI threshold comparison logic (WARNING/CRITICAL/GOOD)
  - [Unit] Heatmap coordinates match severity+likelihood model
  - [Unit] Trend calculation (MoM comparison)
  - [Integration] GET /api/dashboard/executive returns full payload in <500ms
  - [Integration] GET /api/export/csv returns valid CSV
  - [Integration] KPI cached in Redis is served faster than uncached
  - [Functional] Dashboard loads → KPIs match raw data → drill into heatmap → export CSV
  - [Performance] Dashboard API responds under 500ms with 1000 vulns
```

### Sprint 6: Nexus IQ Connector (2 weeks)

**Goal:** Production-ready Sonatype Nexus IQ integration with real sync.

```
Backend:
  - Refactor NexusApiClient to clean architecture:
    • NexusHttpClient: raw HTTP calls with retry + backoff
    • NexusDataMapper: transforms API responses to domain models
    • NexusSyncService: orchestrates sync lifecycle
    • NexusSyncOrchestrator: BullMQ job for scheduled syncs
  - Config stored in database (nexus_config table) not hardcoded
  - POST /api/nexus/sync — trigger sync (now a real background job via BullMQ)
  - GET /api/nexus/sync/status — real job progress via Redis
  - GET /api/nexus/sync/logs — paginated sync history from database
  - GET /api/nexus/products — from database (not mock)
  - GET /api/nexus/vulnerabilities — real data with pagination + filters
  - GET /api/nexus/kpis/executive — real KPI snapshot
  - GET /api/nexus/risk-score/product/:id — 8-factor risk score (existing formula)
  - Mock → real data toggle: flag to switch between mock and live Nexus IQ

Frontend:
  - Nexus executive dashboard with real data from TanStack Query
  - Product drill-down with risk score visualization
  - Vulnerability explorer with search + advanced filters
  - Waiver management UI
  - Connection settings panel (URL, auth, test connection)
  - Sync progress bar (polling /api/nexus/sync/status)
  - Connection probe button
  - CSV + PDF export

Tests:
  - [Unit] NexusApiClient retry logic with exponential backoff
  - [Unit] NexusDataMapper field transformation accuracy
  - [Unit] 8-factor risk score formula (test all boundary conditions)
  - [Unit] Token masking in logs
  - [Integration] Sync job status progression
  - [Integration] Config CRUD
  - [Integration] Product radar endpoint returns correct data
  - [Functional] Configure Nexus IQ → test connection → trigger sync → view dashboard → export
  - [Performance] Bulk sync handles 5000+ vulnerabilities
```

### Sprint 7: Production Hardening (2 weeks)

**Goal:** Polish, performance, security audit, documentation.

```
Backend:
  - Rate limiting per endpoint (100 req/min per user, 10 req/min for auth)
  - Input sanitization (XSS prevention, SQL injection prevention via parameterized queries)
  - Request size limits (1MB body limit)
  - CORS whitelist (only allowed origins)
  - Security audit: Helmet headers review, dependency scan (npm audit)
  - Error standardization: all errors follow { error: string, code: string, details?: any }
  - API documentation (OpenAPI/Swagger via swagger-jsdoc + swagger-ui-express)
  - Health check endpoint: /api/health (DB, Redis, Nexus IQ connectivity)
  - Graceful shutdown (SIGTERM handler, close DB pool, drain queues)
  - Database connection pool config (max 20, idle timeout 30s)

Frontend:
  - Loading states (skeleton screens for all pages)
  - Empty states (illustration + message for empty lists)
  - Error boundaries (React error boundary per workspace)
  - Toast notification system for success/error feedback
  - Accessibility audit (tab order, aria labels, contrast)
  - Bundle size optimization (code splitting via React.lazy per route)
  - 404 page
  - Production environment config (env vars for API URL)

Infrastructure:
  - Production Docker Compose with health checks + restart policy
  - Docker multi-stage build (frontend build → nginx, backend → node)
  - CI/CD: lint → test → build → push to registry → deploy
  - .env.example with ALL required vars documented
  - Database backup strategy (pg_dump cron)

Tests:
  - [Unit] All Zod schemas (exhaustive edge case testing)
  - [Unit] Error formatter produces consistent structure
  - [Integration] Rate limiting blocks after threshold
  - [Integration] Health check reports all service statuses
  - [Security] npm audit passes (0 critical, 0 high)
  - [Security] JWT token not exposed in logs
  - [Security] SQL injection attempts rejected
  - [Functional] Full end-to-end: login → navigate all workspaces → CRUD → export → logout
  - [Load] 100 concurrent users → API responds under 2s
```

---

## 5. Testing Strategy per Sprint

### Test Pyramid

```
         ╱──────╲
        ╱  E2E   ╲          ← 5% — Playwright / Cypress (SPRINT 7)
       ╱──────────╲
      ╱Integration  ╲       ← 25% — supertest + DB (EVERY SPRINT)
     ╱────────────────╲
    ╱    Unit Tests     ╲    ← 70% — Vitest / Jest (EVERY SPRINT)
   ╱──────────────────────╲
```

### Testing Tools

| Layer | Tool | Purpose |
|-------|------|---------|
| Unit (backend) | Vitest + node-postgres mock | Service logic, validation, state machines |
| Unit (frontend) | Vitest + Testing Library | Component render, hooks, query behavior |
| Integration | Supertest + testcontainers | API endpoints with real PostgreSQL |
| Functional | Supertest workflows | Multi-step API scenarios |
| E2E | Playwright | Full browser flows (SPRINT 7) |
| Performance | k6 or autocannon | Load testing (SPRINT 7) |

### Test Structure Convention

```
backend/
  tests/
    unit/
      services/
        veg.service.test.ts
        security.service.test.ts
        kpi-engine.service.test.ts
        nexus-sync.service.test.ts
      repositories/
        veg.repository.test.ts
        vuln.repository.test.ts
      middleware/
        auth.middleware.test.ts
        rbac.middleware.test.ts
      validation/
        veg.schema.test.ts
        vuln.schema.test.ts
    integration/
      api/
        auth.test.ts
        veg.test.ts
        security.test.ts
        dashboard.test.ts
        nexus.test.ts
      database/
        migrations.test.ts
        repositories.test.ts
    functional/
      scenarios/
        veg-full-lifecycle.test.ts
        vulnerability-to-waiver.test.ts
        saas-lifecycle.test.ts
    performance/
      dashboard-load.test.ts
      sync-throughput.test.ts

frontend/
  tests/
    components/
      ExecutiveDashboard.test.tsx
      VegList.test.tsx
      ...
    hooks/
      useAuth.test.ts
      useVegRequests.test.ts
    utils/
      formatters.test.ts
```

### Per-Sprint Test Counts

| Sprint | Unit | Integration | Functional | Performance | Total |
|--------|------|-------------|------------|-------------|-------|
| Sprint 0 | 4 | 2 | 2 | 0 | 8 |
| Sprint 1 | 4 | 3 | 2 | 0 | 9 |
| Sprint 2 | 6 | 5 | 3 | 0 | 14 |
| Sprint 3 | 6 | 6 | 3 | 0 | 15 |
| Sprint 4 | 6 | 5 | 3 | 0 | 14 |
| Sprint 5 | 6 | 5 | 3 | 2 | 16 |
| Sprint 6 | 6 | 5 | 3 | 2 | 16 |
| Sprint 7 | 6 | 4 | 3 | 2 | 15 |
| **Total** | **44** | **35** | **22** | **6** | **107** |

---

## 6. Key Architectural Decisions

### 1. API Client Abstraction
Current: components call `store.getVulnerabilities()` which reads localStorage.
**New:** Components use `useQuery(['vulnerabilities'], api.getVulnerabilities)` via TanStack Query. The store only holds UI state (selected filters, sidebar state).

### 2. Real Database First
Current: localStorage with SQL schema file unused.
**New:** All entities stored in PostgreSQL. Six migration files cover all tables. `node-pg-migrate` runs migrations in CI/CD.

### 3. Background Jobs via BullMQ
Current: `store.syncWithPortal()` runs in the browser.
**New:** Nexus IQ sync, KPI recalculation, waiver expiry checks, email notifications run as BullMQ workers, managed via Redis.

### 4. Separation of Mock vs Real Data
Current: NexusApiClient randomly returns mock or real data.
**New:** `USE_MOCK_DATA` env var. When true, services return repository data from seed tables. When false, they read from synced data. Both paths use the same service layer.

### 5. Unified Error Handling
Current: Mix of `console.warn`, `res.status().json()`, and thrown errors.
**New:** `AppError` class with status code, error code, and message. Global error middleware catches all. Frontend: error boundaries catch render errors.

---

## 7. Database Schema Strategy

### Migration Naming Convention
```
001_users_and_roles.sql
002_veg_governance.sql
003_security_vulnerabilities.sql
004_projects_roadmaps.sql
005_saas_privacy.sql
006_audits_committees.sql
007_kpi_snapshots.sql
008_nexus_ingestion.sql
009_seed_data.sql
```

### Key SQL Design Rules
1. All tables have `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
2. All tables have `created_at TIMESTAMPTZ DEFAULT NOW()` and `updated_at TIMESTAMPTZ DEFAULT NOW()`
3. Use `updated_at` trigger to auto-update
4. Foreign keys with `ON DELETE CASCADE` or `SET NULL` as appropriate
5. Indexes on all `(status, severity)`, `(product_id)`, `(application_id)`, `(created_at)` — based on existing `nexus_schema.sql`
6. Soft deletes with `deleted_at TIMESTAMPTZ` for audit-critical entities (VEG, audits, vulnerabilities)

---

## 8. Naming Conventions

| Layer | Convention | Example |
|-------|-----------|---------|
| **Database tables** | snake_case, plural | `veg_requests`, `audit_findings` |
| **API routes** | kebab-case, plural | `/api/security/vulnerabilities`, `/api/veg-requests` |
| **TypeScript files** | kebab-case | `veg.service.ts`, `auth.middleware.ts` |
| **React components** | PascalCase | `ExecutiveDashboard.tsx` |
| **Hooks** | camelCase, prefixed 'use' | `useVegRequests.ts` |
| **Interfaces** | PascalCase | `VEGRequest`, `Vulnerability` |
| **Services** | PascalCase + Service | `VEGService`, `SecurityService` |
| **Repositories** | PascalCase + Repo | `VEGRepo`, `VulnRepo` |

---

## 9. Directory Structure (Production)

```
compliance-risk-control-tower/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Entry point
│   │   ├── app.ts                # Express app setup
│   │   ├── config/
│   │   │   ├── env.ts
│   │   │   ├── database.ts       # DB pool
│   │   │   └── redis.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── rbac.middleware.ts
│   │   │   ├── validate.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   └── rate-limit.middleware.ts
│   │   ├── routes/
│   │   │   ├── index.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── veg.routes.ts
│   │   │   ├── security.routes.ts
│   │   │   ├── project.routes.ts
│   │   │   ├── roadmap.routes.ts
│   │   │   ├── saas.routes.ts
│   │   │   ├── audit.routes.ts
│   │   │   ├── committee.routes.ts
│   │   │   ├── contract.routes.ts
│   │   │   ├── dashboard.routes.ts
│   │   │   ├── nexus.routes.ts
│   │   │   ├── export.routes.ts
│   │   │   └── admin.routes.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── veg.service.ts
│   │   │   ├── security.service.ts
│   │   │   ├── project.service.ts
│   │   │   ├── roadmap.service.ts
│   │   │   ├── saas.service.ts
│   │   │   ├── audit.service.ts
│   │   │   ├── committee.service.ts
│   │   │   ├── contract.service.ts
│   │   │   ├── kpi-engine.service.ts
│   │   │   ├── dashboard.service.ts
│   │   │   ├── nexus-sync.service.ts
│   │   │   └── export.service.ts
│   │   ├── repositories/
│   │   │   ├── user.repo.ts
│   │   │   ├── veg.repo.ts
│   │   │   ├── vuln.repo.ts
│   │   │   ├── waiver.repo.ts
│   │   │   ├── project.repo.ts
│   │   │   ├── saas.repo.ts
│   │   │   ├── audit.repo.ts
│   │   │   ├── committee.repo.ts
│   │   │   ├── nexus-product.repo.ts
│   │   │   ├── kpi-snapshot.repo.ts
│   │   │   └── ...
│   │   ├── core/
│   │   │   ├── errors.ts          # AppError, NotFoundError, etc.
│   │   │   ├── logger.ts          # Pino instance
│   │   │   └── types.ts           # Shared types
│   │   ├── jobs/
│   │   │   ├── queue.ts           # BullMQ queue setup
│   │   │   ├── kpi-recalculation.job.ts
│   │   │   ├── waiver-expiry.job.ts
│   │   │   ├── nexus-sync.job.ts
│   │   │   └── kpi-archive.job.ts
│   │   └── seed/
│   │       └── seed.ts            # Database seed script
│   ├── migrations/
│   │   ├── 001_users_and_roles.sql
│   │   ├── 002_veg_governance.sql
│   │   └── ...
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   ├── functional/
│   │   └── performance/
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   ├── api/
│   │   │   ├── client.ts         # Axios instance with auth interceptor
│   │   │   ├── auth.api.ts
│   │   │   ├── veg.api.ts
│   │   │   ├── security.api.ts
│   │   │   ├── project.api.ts
│   │   │   ├── saas.api.ts
│   │   │   ├── audit.api.ts
│   │   │   ├── committee.api.ts
│   │   │   ├── dashboard.api.ts
│   │   │   └── nexus.api.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useVegRequests.ts
│   │   │   ├── useVulnerabilities.ts
│   │   │   ├── useProjects.ts
│   │   │   ├── useDashboard.ts
│   │   │   └── ...
│   │   ├── store/
│   │   │   ├── ui.store.ts        # Zustand: sidebar, filters, theme
│   │   │   └── auth.store.ts      # Zustand: user, tokens
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── ProtectedRoute.tsx
│   │   │   ├── ui/
│   │   │   │   ├── KpiCard.tsx
│   │   │   │   ├── Heatmap5x5.tsx
│   │   │   │   ├── DataTable.tsx
│   │   │   │   └── ...
│   │   │   └── workspaces/
│   │   │       ├── ExecutiveDashboard.tsx
│   │   │       ├── VegGovernanceWorkspace.tsx
│   │   │       └── ...
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── VegPage.tsx
│   │   │   └── ...
│   │   └── types/
│   │       ├── api.ts             # API response types
│   │       └── domain.ts          # Domain types (from backend sync)
│   ├── tests/
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
├── docker-compose.prod.yml
├── .github/
│   └── workflows/
│       └── ci.yml
├── .env.example
├── ANALYSIS.md
└── PLAN.md
```

---

## 10. Quick-Start (Local Dev After Plan Execution)

```bash
# Clone and setup
git clone <repo>
cp .env.example .env

# Start infrastructure
docker compose up -d postgres redis

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Run migrations
cd ../backend
npm run migrate:up

# Seed data
npm run seed

# Start dev
npm run dev    # Backend on :3000
cd ../frontend
npm run dev    # Frontend on :5173

# Run tests
cd ../backend
npm test              # All tests
npm run test:unit     # Unit only
npm run test:integration  # Integration only
npm run test:functional   # Functional scenarios
```

---

## 11. Migration from Current Code

The existing codebase is NOT discarded — it's the blueprint:

| Current Artifact | Action |
|-----------------|--------|
| `src/types.ts` | Split into domain type files, added DB fields |
| `src/nexusTypes.ts` | Becomes `backend/src/core/types.ts` for Nexus IQ domain |
| `src/mockData.ts` | Becomes seed data migration (`009_seed_data.sql`) |
| `src/realVegRequests.ts` | Becomes seed data for VEG requests |
| `src/store/complianceStore.ts` | Split: business logic → services, state → Zustand, API → TanStack Query |
| `server.ts` | Becomes `backend/src/` routes + services |
| `src/nexusApiClient.ts` | Becomes `backend/src/services/nexus-sync.service.ts` |
| `src/nexusMockData.ts` | Becomes seed/mock data for dev mode |
| `src/components/*.tsx` | Refactored to use hooks + API calls, keep UI layout |
| `nexus_schema.sql` | Becomes `backend/migrations/008_nexus_ingestion.sql` |
| `src/App.tsx` | Becomes `frontend/src/App.tsx` with Router |
