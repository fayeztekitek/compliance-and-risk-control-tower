# Sprint 6 — Executive Dashboard & KPI Engine

**Status:** `COMPLETED` ✅  
**Started:** 2026-06-21  
**Completed:** 2026-06-21  
**Branch:** sprint-6 (merged to main via fast-forward)

---

## Deliverables

| Deliverable | Status | Notes |
|-------------|--------|-------|
| Enhanced KPI engine (16 KPIs, 4 KRIs) | ✅ | totalVulnerabilities, critical/high/open/SLA-overdue/falsePositive/fixed/waived/accepted, projects/deviating/budgetOverrun, activeWaivers, productsRed/Orange/Green, globalRiskScore/complianceScore/securityDebt |
| 4 KRI thresholds with OK/WARNING/BREACHED | ✅ | vuln SLA breach %, critical vuln count, project deviation %, open risk acceptance age |
| 5x5 risk heatmap | ✅ | Severity × age range matrix with cell counts |
| Monthly trends (security + project) | ✅ | Last N months configurable |
| Consolidated executive dashboard payload | ✅ | getExecutiveDashboard() — all KPIs, KRIs, heatmap, trends |
| CSV export service | ✅ | Flattens KPI/KRI/heatmap data to CSV |
| PDF export service | ✅ | Human-readable audit report with sections |
| GET /api/dashboard/executive | ✅ | Consolidated payload |
| GET /api/dashboard/kpi | ✅ | 16 KPI values |
| GET /api/dashboard/kri | ✅ | 4 KRI objects with status |
| GET /api/dashboard/heatmap | ✅ | 5x5 grid |
| GET /api/export/csv | ✅ | CSV download |
| GET /api/export/pdf | ✅ | PDF download |
| Health-check guard in KPI tests | ✅ | Gracefully skips when no DB |
| All routes registered in app.ts | ✅ | Dashboard + export routes |

## New Files

| File | Purpose |
|------|---------|
| `backend/src/services/dashboard.service.ts` | Consolidated getExecutiveDashboard() |
| `backend/src/services/export.service.ts` | CSV + PDF export |
| `backend/src/routes/dashboard.routes.ts` | 5 dashboard endpoints |
| `backend/src/routes/export.routes.ts` | 2 export endpoints |
| `backend/tests/unit/kpi.service.test.ts` | 4 unit tests (KPI, KRI, heatmap, trends) |
| `backend/tests/integration/dashboard.test.ts` | 6 integration tests (dashboard + export) |

## Test Results

| Type | Count | Passing |
|------|-------|---------|
| Unit (KPI) | 4 | 4 |
| Integration (dashboard + export) | 6 | 6 |
| **Sprint total** | **10** | **10** |
| **Grand total** | **134** | **134** |
