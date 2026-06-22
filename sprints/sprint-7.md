# Sprint 7: Production Hardening

**Duration:** 2 weeks
**Goal:** Polish, performance, security audit, documentation, E2E testing.

**Status:** ✅ Completed (partial — see Carried Forward below)
**Branch:** `sprint-7` → `sprint-7-cont` → `main`
**Commits:** `8a6f7be`, `cf04531`, `d997410`, `c08166d`

---

## Tasks Legend
- `[x]` = Completed in this sprint
- `[→]` = Carried forward to future sprint

### Backend — Security Hardening
- [x] Rate limiting: 100 req/min per user (10 req/min for auth endpoints)
- [x] Input sanitization: XSS prevention helmet, SQL injection prevention (parameterized queries)
- [x] Request body size limit: 1MB
- [x] CORS whitelist — only allowed origins
- [x] Security headers audit (Helmet configuration review)
- [x] Dependency vulnerability scan: `npm audit` — 0 critical, 0 high
- [x] Error standardization: all errors return `{ error: string, code: string, details?: any }`
- [x] Global error middleware: catches unhandled errors, logs, returns standardized response

### Backend — Observability
- [x] Structured JSON logging via Pino with correlation IDs per request
- [x] Request logging middleware: method, path, status, duration
- [x] Health check endpoint: `GET /api/health` (DB pool status, Redis, Nexus IQ connectivity)
- [x] Graceful shutdown: SIGTERM handler → close DB pool → drain BullMQ queues → exit

### Backend — Performance
- [x] Database connection pool tuning: max 20, idle timeout 30s
- [→] Redis caching for dashboard endpoint (TTL: 60s)
- [→] API response pagination for all list endpoints (default: 20, max: 100)
- [→] DB index review: query plans for slow queries

### Backend — Documentation
- [x] OpenAPI/Swagger setup: `swagger-jsdoc` + `swagger-ui-express` at `GET /api/docs`
- [x] All endpoints documented with request/response schemas
- [→] `README.md` updated with production setup instructions
- [→] `.env.example` with ALL required variables documented

### Frontend — UX Polish
- [x] Loading states: skeleton screens for all workspaces
- [x] Empty states: illustration + message for empty lists (e.g., "No vulnerabilities found")
- [x] Error boundaries: React `ErrorBoundary` component wrapping each workspace
- [x] Toast notification system: success/error feedback on mutations (TanStack Query `onSuccess`/`onError`)
- [→] Accessibility: tab order, aria labels on interactive elements, color contrast
- [→] Bundle optimization: `React.lazy()` + `Suspense` for all route-level code splitting
- [x] 404 page

### Infrastructure
- [→] Production Docker Compose with health checks + restart policy
- [→] Docker multi-stage build: frontend → nginx, backend → node
- [→] CI/CD: lint → test → build → push to registry → deploy
- [→] Database backup strategy documented (`pg_dump` cron)

### E2E Tests (Playwright)
- [x] Login flow: email/pw → dashboard → verify KPIs render (basic login flow only)
- [→] VEG lifecycle: create → sign departments → approve → verify audit trail
- [→] Security flow: create vuln → request waiver → approve → verify status
- [→] SaaS lifecycle: onboard → privacy assessment → go-live → verify
- [→] Dashboard: all widgets render with real data
- [→] Nexus: configure → sync → view risk scores → export CSV
- [→] RBAC: login as each role → verify sidebar + permission enforcement

---

## Deliverables

- [x] Zero high/critical security vulnerabilities (npm audit) — 0 critical, 0 high, 1 low (esbuild, Windows dev only)
- [x] All API endpoints documented in Swagger UI
- [→] E2E tests passing in CI
- [→] Production Docker Compose deploys in one command
- [→] Bundle size optimized, 404 page [x], error boundaries [x], loading states [x]

---

## Tests

| Type | Count | Description | Status |
|------|-------|-------------|--------|
| Unit | 4 (of 6 planned) | Error formatter, rate limit logic, graceful shutdown, pagination bounds | ✅ (cache TTL, Zod edge cases deferred) |
| Integration | 5 (of 4 planned) | Rate limiting, health check, Swagger docs serve, CORS headers + 404 handling | ✅ |
| Functional | 0 (of 3 planned) | Login → navigate → CRUD → export → logout (manual only) | [→] |
| Performance | 0 (of 2 planned) | 100 concurrent users, bundle size | [→] |

---

## Carried Forward (to Sprint 10+)

| # | Item | Priority | Target |
|---|------|----------|--------|
| CF-1 | Redis caching for dashboard endpoint (TTL: 60s) | Medium | Sprint 10 |
| CF-2 | API response pagination for all list endpoints | High | Sprint 10 |
| CF-3 | DB index review (query plans for slow queries) | Low | Sprint 10 |
| CF-4 | README.md production setup instructions | Low | Sprint 10 |
| CF-5 | `.env.example` with ALL required vars documented | Low | Sprint 10 |
| CF-6 | Accessibility (tab order, aria labels, color contrast) | Medium | Sprint 11 |
| CF-7 | Bundle optimization (React.lazy + Suspense) | Medium | Sprint 11 |
| CF-8 | Production Docker Compose + multi-stage build | Medium | Sprint 11 |
| CF-9 | CI/CD pipeline (lint → test → build → deploy) | Medium | Sprint 11 |
| CF-10 | Database backup strategy documented | Low | Sprint 12 |
| CF-11 | E2E Playwright tests (6 lifecycle flows) | Medium | Sprint 12 |
| CF-12 | Performance tests (100 concurrent, bundle size) | Low | Sprint 12 |
