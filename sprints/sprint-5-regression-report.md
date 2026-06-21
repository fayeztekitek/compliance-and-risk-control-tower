# Sprint 5 Regression Report

**Date:** 2026-06-21
**Branch:** main (merged from sprint-5)
**Commit:** 1ee1f68

## Test Results

| Metric | Value |
|--------|-------|
| Test files | 18 passed |
| Total tests | 123 passed |
| Duration | 7.90s |

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
| **Nexus** | **Unit** | **11** | **✅** |
| **Nexus** | **Integration** | **6** | **✅** |
| **Nexus** | **Functional** | **3** | **✅** |
| Health | Functional | 3 | ✅ |
| **Total** | **All** | **123** | **✅ All Passed** |

## Sprint 5 Changes

- `backend/src/validation/nexus.schema.ts` — Zod schemas for nexus entities
- `backend/src/repositories/nexus.repo.ts` — DB access (24 methods, 6 entities, bulk upsert)
- `backend/src/services/riskScore.service.ts` — 8-factor risk score formula + grade buckets
- `backend/src/services/nexus.service.ts` — Sync orchestration, CRUD, KPI aggregation
- `backend/src/services/nexusHttpClient.ts` — HTTP client (mock + real modes, retry, token masking)
- `backend/src/services/queue.service.ts` — 5 BullMQ queues + workers + cron scheduler
- `backend/src/services/kpi.service.ts` — KPI recalculation with snapshot persistence
- `backend/src/routes/nexus.routes.ts` — 16 endpoints under `/api/nexus`
- `backend/src/app.ts` — Registered nexus routes
- `backend/tests/unit/nexus.service.test.ts` — 11 unit tests
- `backend/tests/integration/nexus.test.ts` — 6 integration tests
- `backend/tests/functional/nexus.functional.test.ts` — 3 functional tests
- `backend/package.json` — Added bullmq dependency

## Verification

- [x] All 123 tests pass (Sprint 0-5)
- [x] Fast-forward merge sprint-5 → main
- [x] Regression run on main
