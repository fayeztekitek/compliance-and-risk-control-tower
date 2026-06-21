# Compliance & Risk Control Tower — Design Document

## Architecture Overview

The application follows a **monorepo architecture** with separate `backend/` and `frontend/` directories, sharing types through an OpenAPI-generated TypeScript client.

```
┌──────────────────────────────────────────────────┐
│                  Client Layer                     │
│  ┌────────────────┐  ┌────────────────────────┐  │
│  │  React SPA     │  │  Swagger UI            │  │
│  │  (Vite + TS)   │  │  (/api/docs)           │  │
│  │  :5173         │  │  :3000                 │  │
│  └────────┬───────┘  └────────────────────────┘  │
└───────────┼──────────────────────────────────────┘
            │  HTTP / JSON
            ▼
┌──────────────────────────────────────────────────┐
│                API Layer (Express)                │
│  ┌──────────┬──────────┬──────────┬──────────┐   │
│  │  Auth    │   VEG    │ Security │   Nexus  │   │
│  │  Routes  │  Routes  │  Routes  │  Routes  │   │
│  ├──────────┼──────────┼──────────┼──────────┤   │
│  │ Dashboard│  Export  │  Project │  ...     │   │
│  │  Routes  │  Routes  │  Routes  │          │   │
│  └──────────┴──────────┴──────────┴──────────┘   │
│                                                    │
│  Middleware Stack:                                  │
│  Helmet → CORS → Rate Limit → Body Parse →         │
│  Request Log → Auth → RBAC → Route → Error Handler │
└──────────────────────┬───────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐
│  PostgreSQL  │ │  Redis   │ │  Nexus   │
│  (Primary)   │ │ (Queues/ │ │  IQ API  │
│              │ │  Cache)  │ │ (Ext.)   │
└──────────────┘ └──────────┘ └──────────┘
```

## Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React | 19 | UI library |
| | TypeScript | 5.8 | Type safety |
| | Vite | 6 | Build tool & dev server |
| | Tailwind CSS | 4 | Utility-first styling |
| | TanStack Query | 5 | Server state management |
| | Zustand | 5 | Client state management |
| | React Router | 7 | Client-side routing |
| | Axios | 1.7 | HTTP client |
| | Recharts | 3.8 | Charts & visualization |
| | React Hook Form | 7.54 | Form handling |
| | Lucide React | 0.546 | Icons |
| **Backend** | Express | 4.21 | HTTP framework |
| | TypeScript | 5.8 | Type safety |
| | tsx | 4.21 | TypeScript execution |
| | pg | 8.13 | PostgreSQL client |
| | Zod | 3.24 | Schema validation |
| | Pino | 9.6 | Structured logging |
| | BullMQ | 5.79 | Background job queues |
| | ioredis | 5.5 | Redis client |
| | Helmet | 8 | Security headers |
| | express-rate-limit | 8.5 | Rate limiting |
| | swagger-jsdoc | 6.3 | OpenAPI spec generation |
| | swagger-ui-express | 5.0 | API documentation UI |
| **Database** | PostgreSQL | 16 | Primary database |
| | Redis | 7 | Queues & caching |
| **DevOps** | Docker | 24 | Containerization |
| | Docker Compose | 2.24 | Service orchestration |
| | GitHub Actions | — | CI/CD |
| **Testing** | Vitest | 3.2 | Test runner |
| | Supertest | 7 | HTTP integration testing |
| | Playwright | 1.61 | E2E browser testing |

## Directory Structure

```
compliance-&-risk-control-tower/
├── backend/
│   ├── migrations/               # SQL migration files (up + down)
│   │   ├── 000_init.sql
│   │   ├── 001_users_and_roles.sql
│   │   ├── 002_veg_governance.sql
│   │   ├── 003_security_vulnerabilities.sql
│   │   ├── 004_projects_roadmaps.sql
│   │   ├── 005_saas_privacy.sql
│   │   ├── 006_audits_committees.sql
│   │   ├── 007_kpi_snapshots.sql
│   │   ├── 008_nexus_ingestion.sql
│   │   └── 009_seed_data.sql
│   ├── scripts/
│   │   └── generate-api-types.ts  # OpenAPI type generation
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts        # PostgreSQL pool config
│   │   │   ├── env.ts             # Environment variables
│   │   │   └── swagger.ts         # OpenAPI spec definition
│   │   ├── core/
│   │   │   ├── app-error.ts       # Custom error class
│   │   │   └── logger.ts          # Pino logger setup
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts  # JWT authentication
│   │   │   ├── error.middleware.ts # Global error handler
│   │   │   ├── rateLimit.middleware.ts
│   │   │   └── rbac.middleware.ts  # Role-based access
│   │   ├── repositories/          # Database access layer
│   │   ├── routes/                # Express route handlers
│   │   │   ├── auth.routes.ts
│   │   │   ├── veg.routes.ts
│   │   │   ├── security.routes.ts
│   │   │   ├── project.routes.ts
│   │   │   ├── nexus.routes.ts
│   │   │   ├── dashboard.routes.ts
│   │   │   └── export.routes.ts
│   │   ├── services/              # Business logic
│   │   │   ├── auth.service.ts
│   │   │   ├── veg.service.ts
│   │   │   ├── security.service.ts
│   │   │   ├── project.service.ts
│   │   │   ├── nexus.service.ts
│   │   │   ├── kpi.service.ts
│   │   │   ├── dashboard.service.ts
│   │   │   └── export.service.ts
│   │   └── index.ts               # Server entry point
│   ├── tests/
│   │   ├── unit/                  # Unit tests (19 files)
│   │   ├── integration/           # Integration tests (5 files)
│   │   └── functional/            # Functional tests (4 files)
│   ├── Dockerfile
│   ├── vitest.config.ts
│   └── package.json
├── frontend/
│   ├── e2e/                       # Playwright E2E tests
│   │   └── login.spec.ts
│   ├── src/
│   │   ├── api/                   # API client modules
│   │   │   ├── client.ts          # Axios singleton with interceptors
│   │   │   ├── veg.api.ts
│   │   │   ├── security.api.ts
│   │   │   ├── dashboard.api.ts
│   │   │   ├── export.api.ts
│   │   │   └── generated/         # OpenAPI-generated types
│   │   ├── components/
│   │   │   ├── layout/            # Sidebar, ProtectedRoute
│   │   │   └── ui/                # Shared UI components
│   │   │       ├── ErrorBoundary.tsx
│   │   │       ├── EmptyState.tsx
│   │   │       ├── Skeleton.tsx
│   │   │       └── Toast.tsx
│   │   ├── hooks/                 # TanStack Query hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useVegRequests.ts
│   │   │   ├── useSecurity.ts
│   │   │   └── useDashboard.ts
│   │   ├── pages/                 # Page components
│   │   │   ├── LoginPage.tsx
│   │   │   ├── ExecutiveDashboard.tsx
│   │   │   ├── VegGovernanceWorkspace.tsx
│   │   │   ├── SecurityGovernanceWorkspace.tsx
│   │   │   └── NotFoundPage.tsx
│   │   ├── store/                 # Zustand stores
│   │   │   ├── auth.store.ts
│   │   │   └── ui.store.ts
│   │   ├── App.tsx                # Root component with routing
│   │   └── main.tsx               # Entry point
│   ├── playwright.config.ts
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml             # Development orchestration
├── docker-compose.prod.yml        # Production orchestration
├── sprints/                       # Sprint planning & reports
└── docs/                          # Documentation
```

---

## Database Schema

### Entity Relationship Overview

```
users ──┬── veg_requests ──┬── opportunities ──┬── contracts
         │                  │
         │                  └── veg_department_signoffs
         │
         ├── vulnerabilities ──┬── waivers
         │                     ├── risk_acceptances
         │                     └── sla_incidents
         │
         ├── projects ──┬── roadmaps
         │              ├── rtd_submissions
         │              └── go_live_readiness
         │
         ├── saas_applications ──┬── data_processing_inventory
         │
         ├── audits ──┬── audit_findings ──┬── corrective_actions
         │
         ├── contractual_obligations
         │
         ├── committees ──┬── committee_agenda
         │                └── committee_decisions
         │
         ├── nexus_products ──┬── nexus_applications ──┬── nexus_vulnerabilities
         │                    │                        └── nexus_policy_violations
         │                    ├── nexus_waivers
         │                    └── nexus_kpi_snapshots
         │
         └── nexus_sync_logs
```

### Key Design Decisions

1. **Migration-based schema management** — All schema changes are versioned SQL files with reversible `_down.sql` scripts for safe rollbacks.

2. **Enum types** — PostgreSQL enums for statuses, roles, severities ensure data integrity.

3. **Indexed foreign keys** — All relationships have indexes for query performance.

4. **JSONB for flexible metadata** — Where appropriate, extensible fields use JSONB.

---

## API Design

### Authentication Flow

```
┌────────────┐         ┌───────────┐
│  Frontend  │         │  Backend  │
└─────┬──────┘         └─────┬─────┘
      │  POST /api/auth/login│
      │─────────────────────▶│
      │    { email, password }│
      │◀─────────────────────│
      │  { token, refresh,   │
      │    user }            │
      │                      │
      │  (stores in          │
      │   localStorage)      │
      │                      │
      │  GET /api/*          │
      │  Authorization: Bearer│
      │─────────────────────▶│
      │  (JWT verified)      │
      │◀─────────────────────│
      │  200 OK / 401        │
      │                      │
      │  POST /api/auth/     │
      │  refresh (on 401)    │
      │─────────────────────▶│
      │  { refreshToken }    │
      │◀─────────────────────│
      │  { token }           │
```

**Token rotation:** Each refresh invalidates the previous refresh token and issues a new one, stored as a bcrypt hash in the database.

### RBAC Enforcement

The RBAC middleware uses a hierarchical permission system:

1. Each user has one of 7 roles with a numeric rank (100 → 30)
2. Each route defines which roles are allowed
3. A user is authorized if their rank >= the minimum required rank for any allowed role

### Response Format

**Success:**
```json
{
  "data": { ... }
}
```

**Paginated:**
```json
{
  "data": [ ... ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

**Error:**
```json
{
  "error": "Human-readable message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient role permissions |
| `VALIDATION_ERROR` | 400 | Zod schema validation failure |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Duplicate resource |
| `INTERNAL_ERROR` | 500 | Unhandled server error |

---

## Security Architecture

| Layer | Measure | Implementation |
|-------|---------|----------------|
| Transport | CORS | Whitelist of allowed origins |
| Transport | Helmet | Security headers (XSS, CSP, etc.) |
| API | Rate limiting | 100 req/min global, 10 req/min auth |
| API | Body size limit | 1 MB max JSON payload |
| API | Request validation | Zod schemas on all inputs |
| Auth | JWT | RS256-signed tokens (configurable) |
| Auth | Password hashing | bcryptjs with salt rounds |
| Auth | Refresh rotation | Old tokens invalidated on refresh |
| Database | SQL injection | Parameterized queries via pg driver |
| Database | Connection pool | Max 20 connections, idle timeout 30s |

---

## Background Jobs (BullMQ)

| Queue | Schedule | Purpose |
|-------|----------|---------|
| nexus-sync | On-demand | Trigger Nexus IQ synchronization |
| sla-breach | Every 15 min | Detect SLA breaches on open vulnerabilities |
| waiver-expiry | Every 15 min | Check and auto-expire waivers |
| email-notify | On-demand | Send email notifications |
| kpi-recalc | Every 15 min | Recalculate KPI snapshots |

---

## KPI Engine

16 KPIs computed from live database queries:

**Security (8):** Total vulns, Critical, High, Open, SLA Overdue, False Positives, Fixed, Waived, Accepted Risks

**Delivery (3):** Total Projects, Deviating Projects, Budget Overruns

**Compliance (3):** Active Waivers, Compliance Score, Security Debt Score

**Product (3):** Red/Orange/Green product counts, Global Risk Score

### 8-Factor Risk Score Model

| Factor | Max Weight | Measurement |
|--------|-----------|-------------|
| CVSS Score | 40 | Base CVSS × 4 |
| Severity | 15 | CRITICAL=15, HIGH=10, MEDIUM=5, LOW=2 |
| Reachability | 15 | REACHABLE=15, UNKNOWN=5, NOT_REACHABLE=0 |
| Exploitability | 10 | EASY=10, MEDIUM=6, HARD=3, THEORETICAL=0 |
| Age | 10 | >90d=10, >30d=5, <30d=2 |
| Business Criticality | 10 | CRITICAL=10, HIGH=7, MEDIUM=4, LOW=1 |
| Waiver Penalty | -15 | Waived=-15, Accepted=-10 |
| Fix Available | +10 | Penalty if fix exists but not applied |

**Grade thresholds:** RED ≥ 60, ORANGE ≥ 30, GREEN < 30

---

## Testing Strategy

| Layer | Tool | Scope | Count |
|-------|------|-------|-------|
| Unit | Vitest | Services, utilities, middleware | ~110 tests |
| Integration | Vitest + Supertest | HTTP endpoints, auth, RBAC | ~28 tests |
| Functional | Vitest | End-to-end API flows | ~8 tests |
| E2E | Playwright | Browser login flows | 4 tests |

---

## Key Architectural Decisions

1. **Monorepo with backend/frontend split** — Clear separation of concerns; shared types via OpenAPI codegen

2. **Hierarchical RBAC** — Roles inherit from lower ranks, reducing per-route configuration

3. **Refresh token rotation** — Each refresh issues a new hash; old tokens invalidated for security

4. **Migration down scripts** — Every migration has a reversible `_down.sql` for safe rollbacks

5. **healthCheck() guard in tests** — DB-dependent tests are gracefully skipped when PostgreSQL isn't available

6. **BullMQ for background jobs** — Redis-backed queue system for async processing with retry logic

7. **OpenAPI-first API documentation** — JSDoc annotations generate Swagger UI automatically
