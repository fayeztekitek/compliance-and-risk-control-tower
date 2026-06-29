# Phase 5: Dashboard Strategy — Committees, SaaS & Roadmaps

## Goal
Build the remaining 3 strategic dashboards (Committees, SaaS, Roadmaps) and add CSV export to all 6 dashboards.

## Deliverables

### Committees Dashboard
- **Backend**: `backend/src/services/committees-dashboard.service.ts`
- **Route**: `GET /api/dashboard/committees` (auth + RBAC: ADMIN, COMPLIANCE_OFFICER, EXECUTIVE_READ_ONLY)
- **KPIs**: total_committees, planned, held, cancelled, by type (VEG, Vuln, SaaS, Exec Security, Exec Arbitration), total_decisions, approved, rejected, deferred
- **Charts**: BarChart (committees by type), PieChart (decision outcomes)
- **Lists**: Upcoming committees next 30 days, recent decisions with outcome badges
- **Tables used**: `committees`, `committee_decisions`

### SaaS Dashboard
- **Backend**: `backend/src/services/saas-dashboard.service.ts`
- **Route**: `GET /api/dashboard/saas` (auth + RBAC: ADMIN, COMPLIANCE_OFFICER, EXECUTIVE_READ_ONLY)
- **KPIs**: total_apps, avg_readiness, by lifecycle stage (onboarding/go_live/offboarding), GDPR risk distribution, privacy design status, steering check pass/fail
- **Charts**: PieChart (lifecycle stage), BarChart (GDPR risk), PieChart (privacy design status)
- **Tables used**: `saas_applications`

### Roadmaps Dashboard
- **Backend**: `backend/src/services/roadmaps-dashboard.service.ts`
- **Route**: `GET /api/dashboard/roadmaps` (auth + RBAC: ADMIN, EXECUTIVE_READ_ONLY)
- **KPIs**: total_roadmaps, avg_progress, by type (strategic/budgetary/regulatory), milestone status (on_time/delayed/critical), total_projects, project health (on_track/deviating/high_risk), avg RTD, budget utilization
- **Charts**: PieChart (milestone status), BarChart (project health), PieChart (go-live readiness)
- **Tables used**: `roadmaps`, `projects`

### CSV Export
- **Utility**: `frontend/src/utils/export-csv.ts` — generic `downloadCsv(data, filename)` function
- **Component**: `frontend/src/components/ui/ExportButton.tsx` — reusable button with disabled state
- **Integration**: Export buttons added to all 6 dashboard pages (Compliance, Risk, Audit, Committees, SaaS, Roadmaps)

## Architecture Decisions
- All 3 dashboards follow the established pattern from Phases 4-5: backend service → route → frontend API type → frontend page
- KPIs use PostgreSQL aggregate functions with `FILTER (WHERE ...)` for efficient single-pass computation
- Export is client-side only (no backend endpoint needed) — works with any data array

## Files Created
- `backend/src/services/committees-dashboard.service.ts`
- `backend/src/services/saas-dashboard.service.ts`
- `backend/src/services/roadmaps-dashboard.service.ts`
- `backend/src/routes/committees-dashboard.routes.ts`
- `backend/src/routes/saas-dashboard.routes.ts`
- `backend/src/routes/roadmaps-dashboard.routes.ts`
- `frontend/src/pages/CommitteesDashboard.tsx`
- `frontend/src/pages/SaaSDashboard.tsx`
- `frontend/src/pages/RoadmapsDashboard.tsx`
- `frontend/src/utils/export-csv.ts`
- `frontend/src/components/ui/ExportButton.tsx`

## Files Modified
- `backend/src/app.ts` — added 3 new dashboard route registrations
- `frontend/src/api/dashboard.api.ts` — added 3 interfaces + 3 fetch functions
- `frontend/src/App.tsx` — added 3 lazy imports + 3 route paths

## Verification
- All 6 dashboard endpoints return 200 with correct KPIs structure
- Roadmaps dashboard shows real seeded data (5 roadmaps, 59% avg progress, 8 projects)

## Next Steps
Phase 6 — Backend Refactoring (Workflow/Notification/Reporting/KPI engines)
