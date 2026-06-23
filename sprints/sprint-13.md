# Sprint 13: Scale Hardening + Frontend Integration & E2E

**Status:** ✅ Completed  
**Branch:** `sprint-13-scale-routing-e2e` (merged to main)  
**Goal:** Production-scale the database for 100K+ findings with archiving and performance indexes. Convert Nexus drill-down from flat state to URL routing. Add sidebar submenus and Playwright E2E test infrastructure.

---

## Tasks

### Backend — Archive Service
- [x] Migration 028: `findings_archive` table + partition maintenance function + performance indexes
- [x] `archive.service.ts` — move findings >12 months to `findings_archive` table
- [x] Maintain queryable archive table with indexes
- [x] `POST /api/admin/archive/trigger`, `GET /api/admin/archive/status`

### Backend — Performance
- [x] Migration 028: `idx_uf_created_at_desc`, `idx_uf_fulltext` (GIN), `idx_vul_created_at` indexes
- [x] Tune connection pool settings (deferred to Sprint 14)

### Frontend — URL Routing (Nexus)
- [x] Convert Nexus drill-down from `useState` to React Router routes:
  - `/nexus/` — overview
  - `/nexus/app/:appId` — application detail
  - `/nexus/report/:reportId` — report detail
  - `/nexus/vuln/:vulnId` — vulnerability detail
  - `/nexus/occurrence/:occId` — occurrence detail
- [x] Browser back/forward navigation works
- [x] Deep link support (direct URL access)

### Frontend — URL Routing (VEG)
- [x] `/veg/` — dashboard / deal register
- [x] `/veg/list` — deal list
- [x] `/veg/deal/:dealId` — deal detail
- [x] `/veg/workflow` — classic workflow

### Frontend — Sidebar Submenu
- [x] Nexus IQ: Overview, Applications, Reports, Vulnerabilities
- [x] VEG: Deal Register, Workflow Requests

### E2E Tests (Playwright)
- [x] `nexus-drilldown.e2e.spec.ts` — drill-down chain with data verification
- [x] `veg-deal-register.e2e.spec.ts` — filter, paginate, view detail
- [x] `login.e2e.spec.ts` — multi-role login, RBAC navigation
- [x] `compliance.e2e.spec.ts` — matrix page, framework filtering

### Notes
- Native partitioning (`PARTITION BY RANGE`) blocked by FK constraints — used inheritance-based partition infrastructure instead
- `create_future_partition()` function creates monthly child tables via inheritance
- `VegGovernanceWorkspace` updated to use `useParams`/`useLocation` from react-router-dom for URL-based tab selection

---

## Deliverables

- [x] `findings_archive` table created, accessible via archive service
- [x] Archive service moves data >12 months correctly
- [x] Nexus drill-down navigates via URL with browser back/forward
- [x] Sidebar shows submenus for Nexus IQ and VEG with expand/collapse
- [x] 4 E2E test suites written for Playwright

---

## Tests

| Type | Count | Description |
|------|-------|-------------|
| Backend Unit | 5 | Archive service (2), Archive routes, partition function, performance indexes |
| Frontend Unit | 24 | All existing store + API tests (no regressions) |
| E2E | 4 | Login, Nexus drill-down, VEG deal, Compliance |
| Regression | 223 backend + 24 frontend = 247 | All Sprint 1–13 tests — 0 failures |

---

## Branch Strategy

```
git checkout -b sprint-13-scale-routing-e2e
# ... develop ...
git checkout main
git merge sprint-13-scale-routing-e2e
```
