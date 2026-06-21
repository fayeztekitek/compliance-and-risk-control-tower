# Sprint 4 — Projects, Roadmaps, SaaS, Audits, Committees, KPI

**Status:** `COMPLETED` ✅  
**Started:** 2026-06-21  
**Completed:** 2026-06-21  
**Branch:** sprint-4 (merged to main via fast-forward)

---

## Deliverables

| Deliverable | Status | Notes |
|-------------|--------|-------|
| Project CRUD with lifecycle state machine | ✅ | DRAFT → ACTIVE → ON_HOLD → COMPLETED → CANCELLED |
| Roadmap/RTC submissions with variance calculation | ✅ | planned_vs_actual |
| SaaS catalog with lifecycle (PILOT → ACTIVE → DECOMMISSIONED) | ✅ | Enforced state transitions |
| Privacy assessment submissions | ✅ | |
| Readiness score calculation | ✅ | |
| Audit CRUD | ✅ | |
| Findings linked to audits | ✅ | |
| CAPA (corrective actions) with close/evidence workflow | ✅ | |
| Committee CRUD | ✅ | |
| Committee decisions | ✅ | |
| Contractual obligations with verification | ✅ | |
| Integration tests (auth-gated) | ✅ | 4 tests |
| Functional tests (audit→finding→CAPA→close, committee→decision) | ✅ | 2 flows |
| Unit tests (21 scenarios, mocked repo) | ✅ | All pass |

## Test Results

| Type | Count | Passing |
|------|-------|---------|
| Unit (project.service) | 21 | 21 |
| Integration (project API) | 4 | 4 |
| Functional (project flows) | 2 | 2 |
| **Sprint total** | **27** | **27** |
| **Grand total** | **103** | **103** |

## New Files

| File | Purpose |
|------|---------|
| `backend/src/validation/project.schema.ts` | Zod schemas |
| `backend/src/repositories/project.repo.ts` | DB access (24 methods) |
| `backend/src/services/project.service.ts` | Business logic |
| `backend/src/routes/project.routes.ts` | REST endpoints |
| `backend/tests/unit/project.service.test.ts` | 21 unit tests |
| `backend/tests/integration/project.test.ts` | 4 integration tests |
| `backend/tests/functional/project.functional.test.ts` | 2 end-to-end flows |
