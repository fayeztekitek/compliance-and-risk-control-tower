# Sprint 6 Regression Report

**Date:** 2026-06-21
**Branch:** main (merged from sprint-6)
**Commit:** 25e1516

## Test Results

| Metric | Value |
|--------|-------|
| Test files | 20 passed |
| Total tests | 134 passed |
| Duration | 10.18s |

## Test Breakdown

| Layer | Type | Tests | Status |
|-------|------|-------|--------|
| Auth | Unit | 4 | ✅ |
| Auth | Integration | 6 | ✅ |
| RBAC | Unit | 7 | ✅ |
| Logger | Unit | 4 | ✅ |
| Errors | Unit | 6 | ✅ |
| VEG | Unit | 15 | ✅ |
| VEG | Integration | 5 | ✅ |
| VEG | Functional | 1 | ✅ |
| Security | Unit | 15 | ✅ |
| Security | Integration | 5 | ✅ |
| Security | Functional | 2 | ✅ |
| Project | Unit | 21 | ✅ |
| Project | Integration | 4 | ✅ |
| Project | Functional | 2 | ✅ |
| Nexus | Unit | 11 | ✅ |
| Nexus | Integration | 6 | ✅ |
| Nexus | Functional | 3 | ✅ |
| **KPI** | **Unit** | **4** | **✅** |
| **Dashboard** | **Integration** | **6** | **✅** |
| Health | Functional | 3 | ✅ |
| **Total** | **All** | **134** | **✅ All Passed** |

## Sprint 6 Changes

- `backend/src/services/dashboard.service.ts` — Consolidated `getExecutiveDashboard()`
- `backend/src/services/export.service.ts` — CSV + PDF export service
- `backend/src/services/kpi.service.ts` — Enhanced KPI engine (16 KPIs, 4 KRIs, 5x5 heatmap, monthly trends)
- `backend/src/routes/dashboard.routes.ts` — 5 endpoints under `/api/dashboard`
- `backend/src/routes/export.routes.ts` — 2 endpoints under `/api/export`
- `backend/src/app.ts` — Registered dashboard + export routes
- `backend/tests/unit/kpi.service.test.ts` — 4 unit tests (KPI, KRI, heatmap, trends)
- `backend/tests/integration/dashboard.test.ts` — 6 integration tests (dashboard + export)

## Verification

- [x] All 134 tests pass (Sprint 0-6)
- [x] Fast-forward merge sprint-6 → main
- [x] Regression run on main
