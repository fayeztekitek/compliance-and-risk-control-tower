# Phase 0: Architecture Assessment Report

> Status: ✅ Approved

## Executive Summary

The Compliance & Risk Control Tower is an **advanced, fully-implemented monorepo application** with 26 pages, 28 components, 18 custom hooks, 110+ API endpoints, and 251 passing tests. All pages are real implementations — none are stubs.

The application is already remarkably mature for a custom-built GRC platform. However, it was built incrementally feature-by-feature, resulting in accumulated technical debt that now constrains scaling toward enterprise-grade.

---

## 1. Architecture Assessment

### What Exists

| Layer | Assessment |
|-------|-----------|
| **Frontend** | React 19 + Vite 6 + TypeScript 5.8. 26 fully implemented pages. 28 components across 5 directories. 18 custom hooks (TanStack Query v5). 4 Zustand stores. Tailwind CSS v4. Recharts. Lucide icons. |
| **Backend** | Express 4.21 + TypeScript. 26 route modules. 36 services. 13 repositories. 55 SQL migrations. BullMQ (Redis) job queues. Pino logging. Swagger/OpenAPI. |
| **Database** | PostgreSQL 16 with 44+ tables across migrations. `node-pg-migrate` for versioning. Raw SQL (no ORM). |
| **Auth** | JWT access/refresh tokens. 7-role RBAC with numeric hierarchy. Axios interceptor for auto-refresh. |
| **Infrastructure** | Docker Compose (4 services: postgres, redis, api, frontend). Dev + Prod Dockerfiles. Healthchecks. |
| **Testing** | 251 total tests (34 backend files: unit/integration/functional; 4 frontend unit; 5 E2E Playwright). |
| **Integrations** | Nexus IQ (scheduled sync), Fortify, Veracode, SonarQube (webhook). EPSS + CISA KEV enrichment. Slack + email notifications. |
| **Risk Engine** | 8-factor weighted scoring model (CVSS, EPSS, CISA KEV, severity, reachability, age, business criticality, fix available). |

### Architecture Diagram

```
┌─ Client Layer ─────────────────────────────────┐
│  Browser (port 5173)                            │
│  ┌──────────────────────────────────────────┐   │
│  │  React SPA (Vite dev server)             │   │
│  │  ├─ React Router v7 (22 routes)          │   │
│  │  ├─ TanStack Query v5 (data fetching)    │   │
│  │  ├─ Zustand v5 (4 stores)                │   │
│  │  ├─ Auth: JWT (localStorage)             │   │
│  │  └─ Charts: Recharts                     │   │
│  └──────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────────┘
                   │ HTTP/JSON (proxy → 3000)
┌─ API Layer ──────┴──────────────────────────────┐
│  Express (port 3000)                             │
│  ├─ Middleware: Helmet → CORS → RateLimit →     │
│  │   BodyParser → Correlation → Auth → RBAC     │
│  ├─ 26 Route modules → 36 Services → 13 Repos   │
│  ├─ Swagger UI at /api-docs                      │
│  └─ Error: centralized AppError hierarchy        │
└──────────────┬─────────────────┬─────────────────┘
               │                 │
┌──────────────▼──────┐ ┌───────▼──────────────┐
│  PostgreSQL 16      │ │  Redis 7             │
│  ├─ 44+ tables      │ │  ├─ BullMQ queues    │
│  ├─ 55 migrations   │ │  └─ Cache layer      │
│  └─ Raw SQL (pg)    │ │                      │
└─────────────────────┘ └──────────────────────┘
                         ┌──────────────────────┐
                         │  External Integrations│
                         │  ├─ Nexus IQ API      │
                         │  ├─ Fortify API       │
                         │  ├─ Veracode API      │
                         │  ├─ SonarQube webhook │
                         │  ├─ EPSS + CISA KEV   │
                         │  └─ Slack / Email     │
                         └──────────────────────┘
```

---

## 2. Technical Debt Report

### CRITICAL

| # | Issue | Location | Impact | Effort |
|---|-------|----------|--------|--------|
| 1 | Monolithic workspace pages (1200+ lines) | frontend/src/pages/ | Blocks modular development | Medium |
| 2 | Auth logic inline in App.tsx | frontend/src/App.tsx | Hard to test | Small |
| 3 | AuthLayout defined inline | frontend/src/App.tsx | Cannot reuse | Small |
| 4 | Types duplicated frontend/backend | Both layers | Sync risk | Large |
| 5 | No type safety for API responses | frontend/src/api/ | Runtime crashes | Medium |
| 6 | `rejectUnauthorized: false` hardcoded | backend/nexusHttpClient.ts | Security risk | Small |
| 7 | CORS origin hardcoded to localhost:5173 | backend/src/app.ts | Deploy risk | Small |

### HIGH

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 8 | No RBAC integration tests | backend/tests/ | Auth bypass risk |
| 9 | Minimal frontend tests (4 files) | frontend/tests/ | Regressions |
| 10 | Minimal E2E (5 specs) | frontend/e2e/ | Flows unvalidated |
| 11 | Inconsistent loading skeletons | frontend/src/pages/ | Poor UX |
| 12 | Inconsistent empty states | frontend/src/pages/ | Poor UX |
| 13 | Basic toast system | ui/Toast.tsx | Notification overload |
| 14 | Migration numbering gaps | backend/migrations/ | Audit confusion |

### MEDIUM

| # | Issue | Effort |
|---|-------|--------|
| 15 | No keyboard navigation | Medium |
| 16 | No global search | Large |
| 17 | No command palette (CTRL+K) | Medium |
| 18 | No i18n | Large |
| 19 | No WebSocket/SSE real-time updates | Medium |
| 20 | No chart abstraction | Medium |
| 21 | No Storybook | Medium |
| 22 | Dark mode not fully refined | Small |
| 23 | Export frontend buttons may be unwired | Small |
| 24 | No audit logging for reads | Medium |

---

## 3. Duplicate Code Report

| Location | Instance | Lines | Recommendation |
|----------|----------|-------|----------------|
| `frontend/src/api/*.api.ts` | Types re-declare backend schemas | ~300 | OpenAPI code gen |
| `frontend/src/pages/*Workspace.tsx` | CRUD patterns repeated 8x | ~200 each | CrudWorkspace template |
| `frontend/src/hooks/use*.ts` | Query/mutation patterns repeated 16x | ~50 each | useCrud factory hook |
| `backend/src/repositories/*.repo.ts` | CRUD SQL repeated 13x | ~40 each | CrudRepository class |
| `frontend/src/components/*/FilterPanel.tsx` | Filter sidebar duplicated | ~105 each | Shared FilterPanel |

---

## 4. Reusable Components Inventory

### Ready to Reuse

| Component | File |
|-----------|------|
| SkeletonCard, SkeletonTable, SkeletonPage | `ui/Skeleton.tsx` |
| EmptyState | `ui/EmptyState.tsx` |
| Pagination | `ui/Pagination.tsx` |
| ErrorBoundary | `ui/ErrorBoundary.tsx` |
| ToastContainer + ToastItem | `ui/Toast.tsx` |
| DataSourceIndicator | `ui/DataSourceIndicator.tsx` |
| BulkActionsToolbar | `ui/BulkActionsToolbar.tsx` |
| FormField, FormInput, FormSelect, FormTextarea | `ui/FormField.tsx` |
| KpiCard | `executive/KpiCard.tsx` |
| Sidebar | `layout/Sidebar.tsx` |
| ProtectedRoute | `layout/ProtectedRoute.tsx` (unused) |

### Needs Refactoring

| Component | Action |
|-----------|--------|
| FilterPanel (executive + veg) | Extract to generic FilterPanel |
| VegFinancialCharts | Extract generic chart wrapper |
| VegKpiCards | Parameterize with config |
| VegDecisionTable | Extract generic data table |

---

## 5. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| No shared types → runtime crashes | High | High | OpenAPI code generation |
| Monolithic pages → merge conflicts | Medium | High | Decompose into features |
| Minimal frontend tests → regressions | High | Medium | Increase test coverage |
| RBAC not tested → privilege escalation | Low | Critical | Add RBAC integration tests |
| Hardcoded Nexus TLS → MiTM | Low | High | Configurable TLS |
| Auth in localStorage → XSS theft | Medium | Critical | HttpOnly cookies |

---

## 6. Improvement Opportunities

### Quick Wins (1-2 days)
1. Wire ProtectedRoute into App.tsx
2. Extract AuthLayout into separate component
3. Add empty states to pages that lack them
4. Add loading skeletons to pages with inline spinners
5. Dark mode refinements
6. Fix migration numbering gaps
7. Escape key to close modals

### Medium Wins (3-5 days)
8. Create CrudRepository base class
9. Create useCrud factory hook
10. Create CrudWorkspace template
11. Extract shared FilterPanel component
12. Add RBAC integration tests

### Strategic Wins (2-4 weeks)
13. OpenAPI code generation for shared types
14. Decompose monolithic workspace pages
15. Global search across all domains
16. WebSocket/SSE for real-time updates
17. Frontend test coverage to 70%+

---

## 7. Prioritized Refactoring Plan

| Order | Items | Duration | Outcome |
|-------|-------|----------|---------|
| Q1 | Extract AuthLayout, Wire ProtectedRoute, Fix empty/skeleton states | 2-3 days | Foundational cleanup |
| Q2 | Migrate workspace pages to feature-component decomposition | 5-7 days | Modular frontend |
| Q3 | CrudRepository + useCrud + CrudWorkspace | 5-7 days | Eliminate duplication |
| Q4 | OpenAPI code gen + shared types | 5-7 days | Type-safe API contract |
| Q5 | RBAC tests, global search, real-time updates | 2-3 weeks | Enterprise readiness |
| Q6 | Full test coverage, Playwright expansion | 2-3 weeks | Confidence for scaling |

---

## 8. Master Prompt Alignment

| Phase | Current State | Gap |
|-------|--------------|-----|
| 0 Assessment | ✅ Delivered | — |
| 1 Product Vision | ✅ Delivered | — |
| 2 Enterprise Architecture | ⚠️ Partially designed | DDD-driven redesign needed |
| 3 Information Architecture | ⚠️ 9 domains exist | 3 new domains needed |
| 4 Navigation | ❌ Basic sidebar | No search, favorites, command palette |
| 5 Dashboard Strategy | ✅ Executive + VEG + COMEX | Missing Security, SaaS, Audit, Compliance |
| 6 Backend Refactoring | ⚠️ Mostly good | Workflow/notification/reporting engines |
| 7 Frontend Refactoring | ⚠️ Needs modularization | Per debt report |
| 8 AI Platform | ❌ None | Complete new build |
| 9 AI Chatbot | ❌ None | Complete new build |
| 10 AI Agents | ❌ None | Complete new build |
| 11 MCP Integration | ❌ None | Complete new build |
| 12 Knowledge Base/RAG | ❌ None | Complete new build |
| 13 Workflow Engine | ❌ Basic VEG only | Generalized engine needed |
| 14 Testing Strategy | ⚠️ 251 tests exist | AI prompt, a11y, perf tests |
| 15 DevOps | ✅ Docker + Compose | K8s + IaC + monitoring |
