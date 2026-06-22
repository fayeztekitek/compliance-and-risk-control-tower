# Sprint 8 — Regression Report

**Date:** 2026-06-21  
**Branch:** main

---

## Results

**22 test files — 143 tests — 14.61s — All passing**

| Test file | Tests | Status |
|-----------|-------|--------|
| `tests/functional/health.test.ts` | 3 | ✅ |
| `tests/functional/nexus.functional.test.ts` | 3 | ✅ |
| `tests/functional/project.functional.test.ts` | 2 | ✅ |
| `tests/functional/security.functional.test.ts` | 2 | ✅ |
| `tests/functional/veg.functional.test.ts` | 1 | ✅ |
| `tests/integration/auth.test.ts` | 6 | ✅ |
| `tests/integration/dashboard.test.ts` | 6 | ✅ |
| `tests/integration/nexus.test.ts` | 6 | ✅ |
| `tests/integration/project.test.ts` | 4 | ✅ |
| `tests/integration/security.test.ts` | 5 | ✅ |
| `tests/integration/sprint7.test.ts` | 5 | ✅ |
| `tests/integration/veg.test.ts` | 6 | ✅ |
| `tests/unit/auth.service.test.ts` | 4 | ✅ |
| `tests/unit/errors.test.ts` | 6 | ✅ |
| `tests/unit/kpi.service.test.ts` | 5 | ✅ |
| `tests/unit/logger.test.ts` | 4 | ✅ |
| `tests/unit/nexus.service.test.ts` | 11 | ✅ |
| `tests/unit/project.service.test.ts` | 23 | ✅ |
| `tests/unit/rbac.test.ts` | 7 | ✅ |
| `tests/unit/security.service.test.ts` | 15 | ✅ |
| `tests/unit/sprint7.test.ts` | 4 | ✅ |
| `tests/unit/veg.service.test.ts` | 15 | ✅ |

## Delta from Sprint 7

- **Test count unchanged**: 143 (Sprint 8 is enhancement-only, no new tests)
- **Test fix**: `project.test.ts` unique code collision resolved
- **Frontend pages added**: 5 new workspaces (Roadmaps, SaaS, Audits, Committees, Admin)
- **Backend routes added**: 3 new route files (audit, committee, admin)
- **Seed migrations added**: 3 new migration files (010-012)
