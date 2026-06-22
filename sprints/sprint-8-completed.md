# Sprint 8 — Completed

**Status:** ✅ Completed  
**Started:** 2026-06-21  
**Completed:** 2026-06-21  
**Branch:** sprint-8 → main (fast-forward)

---

## Deliverables

### Seed Data (Migrations 010–012)
- [x] `010_seed_veg.sql`: 35 VEG requests, 21 opportunities, 12 contracts
- [x] `011_seed_security.sql`: 20 vulnerabilities (CRITICAL/HIGH/MEDIUM/LOW), 5 waivers, 5 risk acceptances
- [x] `012_seed_nexus.sql`: 5 Nexus products, 6 applications, 15 vulnerabilities, 3 sync logs, KPI snapshots, alerts

### Bug Fixes
- [x] Login seed: `crypto.randomUUID()` replaces hardcoded `usr-001` IDs  
- [x] Login seed: `ON CONFLICT (email)` replaces `ON CONFLICT (id)`  
- [x] `seedDefaultUsers()` called on startup in `backend/src/index.ts`  
- [x] KPI query: `rtd_submissions` → `rtd_reviews`  
- [x] Enum: `compliance_status` extended with `OVERDUE` in `002_veg_governance.sql`  
- [x] Enum casts: `::finding_severity`, `::finding_status` added in `009_seed_data.sql`  
- [x] Auto-seed: roadmaps & projects created via `seedReferenceData()` in `index.ts`

### Backend — New Routes
- [x] `audit.routes.ts`: 10 endpoints under `/api/audits` (audit CRUD, findings, CAPA)
- [x] `committee.routes.ts`: 9 endpoints under `/api/committees` (committee CRUD, decisions, obligations)
- [x] `admin.routes.ts`: 7 endpoints under `/api/admin` (user CRUD, activity logs, system health)
- [x] Registered all 3 in `app.ts`

### Frontend — New Pages
- [x] **RoadmapWorkspace**: list with search/filter/pagination, detail with budget/RTD/slippage/readiness cards, create/edit form, RTD submission form
- [x] **SaaSGovernanceWorkspace**: lifecycle stage tracking (Onboarding/Go-Live/Offboarding), readiness scoring, privacy assessments, GDPR risk matrix
- [x] **AuditWorkspace**: audit lifecycle (planned→in progress→closed), findings with severity badges, CAPA tracking
- [x] **CommitteeWorkspace**: committee registry, decisions recording, regulatory obligations tracking
- [x] **AdminWorkspace**: user management (CRUD), activity logs timeline, system health dashboard
- [x] API clients (`project.api.ts`, `saas.api.ts`, `audit.api.ts`, `committee.api.ts`, `admin.api.ts`)
- [x] TanStack Query hooks for all pages
- [x] All pages wrapped in `ErrorBoundary`, registered in `App.tsx` routing

### Fixed Test
- [x] `tests/integration/project.test.ts`: used unique code (`Date.now()`) to avoid DB unique constraint collision

### TypeScript Compliance
- [x] Frontend: zero new errors (2 pre-existing only)
- [x] Backend: zero new errors (pre-existing test-related only)
- [x] Added `src/vite-env.d.ts` with Vite client types reference

---

## Regression Report

| Metric | Value |
|--------|-------|
| Test files | 22 passed |
| Individual tests | 143 passed |
| Duration | 14.61s |
| New tests (Sprint 8) | 0 (enhancement only) |
| Previous total (Sprint 7) | 143 |
| Net increase | 0 |

## Known Issues
- Same as Sprint 7: `&` in path, npm audit lows, git push timeout
- Seed counts may be tripled (migrations 010-012 lack dedup for re-runs)
- Backend cannot spawn child processes (`uv_spawn EPERM`) — start manually via `npm run dev`
