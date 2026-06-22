# Sprint 13: Scale Hardening + Frontend Integration & E2E

**Status:** 📋 Planned  
**Branch:** `sprint-13-scale-routing-e2e`  
**Goal:** Production-scale the database for 100K+ findings with partitioning and archiving. Convert Nexus drill-down from flat state to URL routing. Add comprehensive Playwright E2E tests.

---

## Tasks

### Backend — Partitioning
- [ ] Migration 025: Convert `unified_findings` to partitioned table by month (created_at)
- [ ] Create default partition + migrate existing data
- [ ] Update FK references to work with partitioned table
- [ ] `partition.service.ts` — BullMQ worker `partition-maintenance` on monthly cron
- [ ] Create next month's partition, detach old months

### Backend — Archive Service
- [ ] `archive.service.ts` — move findings >12 months to `findings_archive` table
- [ ] Maintain queryable `UNION ALL` view across live + archive
- [ ] BullMQ daily cron for archive job
- [ ] `POST /api/admin/archive/trigger`, `GET /api/admin/archive/status`

### Backend — Performance
- [ ] Add missing indexes based on query analysis (migration 026)
- [ ] Tune connection pool settings

### Frontend — URL Routing (Nexus)
- [ ] Convert Nexus drill-down from `useState` to React Router nested routes:
  - `/nexus/` — overview
  - `/nexus/app/:appId` — application detail
  - `/nexus/report/:reportId` — report detail
  - `/nexus/vuln/:vulnId` — vulnerability detail
  - `/nexus/occurrence/:occId` — occurrence detail
- [ ] Browser back/forward navigation works
- [ ] Deep link support (direct URL access)

### Frontend — URL Routing (VEG)
- [ ] `/veg/` — dashboard
- [ ] `/veg/list` — deal list
- [ ] `/veg/deal/:id` — deal detail
- [ ] `/veg/workflow` — classic workflow

### Frontend — Sidebar Submenu
- [ ] Nexus IQ: Overview, Applications, Reports, Vulnerabilities
- [ ] VEG: Deal Register, Workflow Requests

### E2E Tests (Playwright)
- [ ] `nexus-drilldown.e2e.spec.ts` — full drill-down chain with data verification, back/forward navigation
- [ ] `veg-deal-register.e2e.spec.ts` — filter, paginate, view detail
- [ ] `veg-workflow.e2e.spec.ts` — create → sign-off → bid → go-nogo → opportunity → contract
- [ ] `login.e2e.spec.ts` — enhance: multi-role login, RBAC navigation
- [ ] `compliance.e2e.spec.ts` — matrix page, framework filtering
- [ ] GitHub Actions workflow for E2E with PostgreSQL service container

---

## Deliverables

- [ ] `unified_findings` partitioned by month
- [ ] Archive service moves data >12 months correctly
- [ ] Nexus drill-down navigates via URL with browser back/forward
- [ ] Sidebar shows submenus for Nexus IQ and VEG
- [ ] 5 E2E test suites passing in Playwright

---

## Tests

| Type | Count | Description |
|------|-------|-------------|
| Backend Unit | 3 | Partition service, archive service, performance indexes |
| Backend Integration | 1 | Archive data movement |
| E2E | 5 | Nexus drill-down, VEG deal, VEG workflow, login, compliance |
| Regression | ~224 | All Sprint 1–12 tests |

---

## Branch Strategy

```
git checkout -b sprint-13-scale-routing-e2e
# ... develop ...
git checkout main
git merge sprint-13-scale-routing-e2e
```
