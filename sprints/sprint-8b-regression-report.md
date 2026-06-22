# Sprint 8b — Regression Report

**Date:** 2026-06-22  
**Branch:** `main` (commit `d908f04` — pre-sprint-9 baseline)

---

## Results

| Metric | Value |
|--------|-------|
| Backend test files | 28 |
| Backend individual tests | ~170 |
| Frontend test files | 4 |
| Frontend individual tests | 24 |
| **Total tests** | **~194** |
| Passing | ~192 (2 pre-existing failures in `security.functional.test.ts`) |

---

## Test File Inventory

### Backend — Unit Tests (13 files)
| File | Tests |
|------|-------|
| `tests/unit/auth.service.test.ts` | 4 |
| `tests/unit/enrichmentWorker.test.ts` | ~6 |
| `tests/unit/epssClient.test.ts` | ~8 |
| `tests/unit/errors.test.ts` | 6 |
| `tests/unit/findingComponent.service.test.ts` | ~8 |
| `tests/unit/findingOccurrence.service.test.ts` | ~10 |
| `tests/unit/kpi.service.test.ts` | 5 |
| `tests/unit/logger.test.ts` | 4 |
| `tests/unit/nexus.service.test.ts` | 11 |
| `tests/unit/organization.service.test.ts` | ~10 |
| `tests/unit/project.service.test.ts` | 23 |
| `tests/unit/reportComparison.service.test.ts` | ~12 |
| `tests/unit/rbac.test.ts` | 7 |
| `tests/unit/scanReport.service.test.ts` | ~10 |
| `tests/unit/security.service.test.ts` | 15 |
| `tests/unit/sprint7.test.ts` | 4 |
| `tests/unit/veg.service.test.ts` | 15 |

### Backend — Integration Tests (6 files)
| File | Tests |
|------|-------|
| `tests/integration/auth.test.ts` | 6 |
| `tests/integration/dashboard.test.ts` | 6 |
| `tests/integration/nexus.test.ts` | 6 |
| `tests/integration/project.test.ts` | 4 |
| `tests/integration/security.test.ts` | 5 |
| `tests/integration/sprint7.test.ts` | 5 |
| `tests/integration/veg.test.ts` | 6 |

### Backend — Functional Tests (5 files)
| File | Tests |
|------|-------|
| `tests/functional/health.test.ts` | 3 |
| `tests/functional/nexus.functional.test.ts` | 3 |
| `tests/functional/project.functional.test.ts` | 2 |
| `tests/functional/security.functional.test.ts` | 2 (pre-existing failures) |
| `tests/functional/veg.functional.test.ts` | 1 |

### Frontend Tests (4 files)
| File | Tests |
|------|-------|
| `tests/auth.store.test.ts` | ~5 |
| `tests/security.api.test.ts` | ~5 |
| `tests/ui.store.test.ts` | ~4 |
| `tests/veg.api.test.ts` | 10 |

---

## Delta from Sprint 8

- **+49 tests** (from 143 to ~192)
- 7 new unit test files (enrichment, EPSS, components, occurrences, organizations, report comparison, scan reports)
- 10 new frontend VEG API tests
- VEG deal service tests (embedded in veg.service.test.ts)

## Known Issues
- `unified_findings.product_id` is NULL for all 64 records
- 2 pre-existing failures in `security.functional.test.ts`
- Seed migrations 010-012 may triple-count on re-run
