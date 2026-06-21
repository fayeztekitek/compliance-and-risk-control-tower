# Sprint 4 Regression Report

**Date:** 2026-06-21
**Branch:** main (merged from sprint-4)
**Commit:** 409bc10

## Test Results

| Metric | Value |
|--------|-------|
| Test files | 15 passed |
| Total tests | 103 passed |
| Duration | 6.97s |

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
| Health | Functional | 3 | ✅ |
| **Total** | **All** | **103** | **✅ All Passed** |

## Sprint 4 Changes

- `backend/src/validation/project.schema.ts` — Zod schemas for projects, roadmaps, SaaS, audits, CAPA, committees, obligations
- `backend/src/repositories/project.repo.ts` — DB access layer (24 methods)
- `backend/src/services/project.service.ts` — Business logic (projects, RTD/variance, SaaS lifecycle, privacy, readiness, audits, findings, CAPA, committees, decisions, obligations)
- `backend/src/routes/project.routes.ts` — REST endpoints (CRUD + sub-resources)
- `backend/src/app.ts` — Registered `/api/projects` route
- `backend/tests/unit/project.service.test.ts` — 21 unit tests
- `backend/tests/integration/project.test.ts` — 4 integration tests
- `backend/tests/functional/project.functional.test.ts` — 2 functional flows

## Verification

- [x] All 103 tests pass (Sprint 0-4)
- [x] Fast-forward merge sprint-4 → main
- [x] Regression run on main
