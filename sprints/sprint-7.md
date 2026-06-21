# Sprint 7: Production Hardening

**Duration:** 2 weeks
**Goal:** Polish, performance, security audit, documentation, E2E testing.

---

## Tasks

### Backend — Security Hardening
- [ ] Rate limiting: 100 req/min per user (10 req/min for auth endpoints)
- [ ] Input sanitization: XSS prevention helmet, SQL injection prevention (parameterized queries)
- [ ] Request body size limit: 1MB
- [ ] CORS whitelist — only allowed origins
- [ ] Security headers audit (Helmet configuration review)
- [ ] Dependency vulnerability scan: `npm audit` — 0 critical, 0 high
- [ ] Error standardization: all errors return `{ error: string, code: string, details?: any }`
- [ ] Global error middleware: catches unhandled errors, logs, returns standardized response

### Backend — Observability
- [ ] Structured JSON logging via Pino with correlation IDs per request
- [ ] Request logging middleware: method, path, status, duration
- [ ] Health check endpoint: `GET /api/health` (DB pool status, Redis, Nexus IQ connectivity)
- [ ] Graceful shutdown: SIGTERM handler → close DB pool → drain BullMQ queues → exit

### Backend — Performance
- [ ] Database connection pool tuning: max 20, idle timeout 30s
- [ ] Redis caching for dashboard endpoint (TTL: 60s)
- [ ] API response pagination for all list endpoints (default: 20, max: 100)
- [ ] DB index review: query plans for slow queries

### Backend — Documentation
- [ ] OpenAPI/Swagger setup: `swagger-jsdoc` + `swagger-ui-express` at `GET /api/docs`
- [ ] All endpoints documented with request/response schemas
- [ ] `README.md` updated with production setup instructions
- [ ] `.env.example` with ALL required variables documented

### Frontend — UX Polish
- [ ] Loading states: skeleton screens for all workspaces
- [ ] Empty states: illustration + message for empty lists (e.g., "No vulnerabilities found")
- [ ] Error boundaries: React `ErrorBoundary` component wrapping each workspace
- [ ] Toast notification system: success/error feedback on mutations (TanStack Query `onSuccess`/`onError`)
- [ ] Accessibility: tab order, aria labels on interactive elements, color contrast
- [ ] Bundle optimization: `React.lazy()` + `Suspense` for all route-level code splitting
- [ ] 404 page

### Infrastructure
- [ ] Production Docker Compose with health checks + restart policy
- [ ] Docker multi-stage build: frontend → nginx, backend → node
- [ ] CI/CD: lint → test → build → push to registry → deploy
- [ ] Database backup strategy documented (`pg_dump` cron)

### E2E Tests (Playwright)
- [ ] Login flow: email/pw → dashboard → verify KPIs render
- [ ] VEG lifecycle: create → sign departments → approve → verify audit trail
- [ ] Security flow: create vuln → request waiver → approve → verify status
- [ ] SaaS lifecycle: onboard → privacy assessment → go-live → verify
- [ ] Dashboard: all widgets render with real data
- [ ] Nexus: configure → sync → view risk scores → export CSV
- [ ] RBAC: login as each role → verify sidebar + permission enforcement

---

## Deliverables

- [ ] Zero high/critical security vulnerabilities (npm audit)
- [ ] All API endpoints documented in Swagger UI
- [ ] E2E tests passing in CI
- [ ] Production Docker Compose deploys in one command
- [ ] Bundle size optimized, 404 page, error boundaries, loading states

---

## Tests

| Type | Count | Description |
|------|-------|-------------|
| Unit | 6 | All Zod schemas (edge cases), error formatter, rate limit logic, graceful shutdown, cache TTL, pagination bounds |
| Integration | 4 | Rate limiting, health check, Swagger docs serve, CORS headers |
| Functional | 3 | Login → navigate all workspaces → CRUD → export → logout |
| Performance | 2 | 100 concurrent users → API under 2s, bundle size under 500KB |
