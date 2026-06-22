# Sprint 8: Unified Findings Architecture (Phases 1–9)

**Goal:** Replace legacy per-scanner vulnerability tables with unified findings schema, EPSS/CISA KEV enrichment, component/occurrence registry, report comparison, mitigation workflow, policy violations, and dashboard MTTR/SLA KPIs.

**Status:** ✅ Completed  
**Branch:** (no dedicated branch — work committed directly to `main` as `a261623`)  
**Commit:** `a261623`

---

## Tasks

### Seed Data Setup (Migrations 010–012)
- [x] `010_seed_veg.sql`: 35 VEG requests, 21 opportunities, 12 contracts
- [x] `011_seed_security.sql`: 20 vulnerabilities (CRITICAL/HIGH/MEDIUM/LOW), 5 waivers, 5 risk acceptances
- [x] `012_seed_nexus.sql`: 5 Nexus products, 6 applications, 15 vulnerabilities, 3 sync logs, KPI snapshots, alerts

### Bug Fixes (pre-existing)
- [x] Login seed: `crypto.randomUUID()` replaces hardcoded `usr-001` IDs
- [x] Login seed: `ON CONFLICT (email)` replaces `ON CONFLICT (id)`
- [x] `seedDefaultUsers()` called on startup in `backend/src/index.ts`
- [x] KPI query: `rtd_submissions` → `rtd_reviews`
- [x] Enum: `compliance_status` extended with `OVERDUE` in `002_veg_governance.sql`
- [x] Enum casts: `::finding_severity`, `::finding_status` added in `009_seed_data.sql`
- [x] Auto-seed: roadmaps & projects created via `seedReferenceData()` in `index.ts`

### Unified Findings Schema (Migrations 013–021)
- [x] `013_unified_findings.sql`: Core `unified_findings` table with severity/status/policy/EPSS columns
- [x] `014_migrate_security_vulns.sql`: Migrate old `vulnerabilities` → `unified_findings`
- [x] `015_migrate_nexus_vulns.sql`: Migrate Nexus vulnerabilities → `unified_findings`
- [x] `016_backward_compat_views.sql`: Views for backward compatibility
- [x] `017_org_app_enhancement.sql`: Organization/app hierarchy columns
- [x] `018_component_occurrence.sql`: `finding_components` + `finding_occurrences` tables
- [x] `020_policy_violations.sql`: Policy violation tracking
- [x] `021_mitigations.sql`: Mitigation lifecycle tables

### Backend — Repositories
- [x] `unifiedFinding.repo.ts`: CRUD + aggregates for unified findings
- [x] `findingComponent.repo.ts`: Component registry per finding
- [x] `findingOccurrence.repo.ts`: Occurrence registry per finding
- [x] `scanReport.repo.ts`: Scan report storage
- [x] `nexus.repo.ts`: Enhanced with unified findings queries

### Backend — Services
- [x] `unifiedFinding.service.ts`: Query/aggregation layer
- [x] `findingComponent.service.ts`: Component CRUD
- [x] `findingOccurrence.service.ts`: Occurrence CRUD
- [x] `scanReport.service.ts`: Report management
- [x] `reportComparison.service.ts`: Side-by-side report diff
- [x] `mitigation.service.ts`: Full mitigation lifecycle (PROPOSED→IN_PROGRESS→VERIFIED→CLOSED/REJECTED)
- [x] `enrichmentWorker.service.ts`: BullMQ worker for EPSS/CISA enrichment
- [x] `epssClient.service.ts`: HTTP client for FIRST EPSS API + CISA KEV
- [x] `organization.service.ts`: Org/application hierarchy
- [x] `trend.service.ts`: KPI trend aggregation
- [x] `export.service.ts`: Enhanced CSV/PDF export
- [x] `kpi.service.ts`: MTTR/SLA KPIs added
- [x] `riskScore.service.ts`: Enhanced risk calculation

### Backend — Routes
- [x] `unifiedFinding.routes.ts`: 4 endpoints
- [x] `findingComponent.routes.ts`: 4 endpoints
- [x] `findingOccurrence.routes.ts`: 4 endpoints
- [x] `scanReport.routes.ts`: 4 endpoints
- [x] `report.routes.ts`: Report comparison endpoints
- [x] `mitigation.routes.ts`: 5 endpoints (full lifecycle)
- [x] `enrichment.routes.ts`: 2 endpoints
- [x] `organization.routes.ts`: 8 endpoints
- [x] `trend.routes.ts`: 2 endpoints
- [x] `dashboard.routes.ts`: Enhanced executive + MTTR/SLA endpoints
- [x] `audit.routes.ts`: 10 endpoints (audit CRUD, findings, CAPA)
- [x] `committee.routes.ts`: 9 endpoints (committee CRUD, decisions, obligations)
- [x] `admin.routes.ts`: 7 endpoints (user CRUD, activity logs, system health)

### Frontend — New Pages
- [x] **RoadmapWorkspace**: list with search/filter/pagination, budget/RTD/slippage/readiness cards, RTD submission
- [x] **SaaSGovernanceWorkspace**: lifecycle stages, readiness scoring, privacy assessments, GDPR risk matrix
- [x] **AuditWorkspace**: audit lifecycle, findings with severity badges, CAPA tracking
- [x] **CommitteeWorkspace**: committee registry, decisions, obligations
- [x] **AdminWorkspace**: user management, activity logs, system health
- [x] **NexusOverview**: scanner suite dashboard
- [x] **NexusApplicationDetail**: application-level drill-down
- [x] **NexusReportDetail**: report-level view
- [x] **NexusReportComparison**: side-by-side report diff
- [x] **NexusVulnerabilityDetail**: vulnerability drill-down
- [x] **ExecutiveDashboard**: enhanced with MTTR/SLA KPI cards

### Frontend — Infrastructure
- [x] API clients (`project.api.ts`, `saas.api.ts`, `audit.api.ts`, `committee.api.ts`, `admin.api.ts`, `nexus.api.ts`, `dashboard.api.ts`)
- [x] TanStack Query hooks for all pages
- [x] Error boundaries on all pages
- [x] All pages registered in `App.tsx` routing
- [x] TypeScript compliance (zero new errors)
- [x] `src/vite-env.d.ts` added

### Tests
- [x] `unit/enrichmentWorker.test.ts` — 75 lines
- [x] `unit/epssClient.test.ts` — 107 lines
- [x] `unit/findingComponent.service.test.ts` — 88 lines
- [x] `unit/findingOccurrence.service.test.ts` — 126 lines
- [x] `unit/organization.service.test.ts` — 109 lines
- [x] `unit/reportComparison.service.test.ts` — 172 lines
- [x] `unit/scanReport.service.test.ts` — 104 lines
- [x] Fixed `integration/project.test.ts` — unique code collision resolved

### Documentation
- [x] `docs/api.md`: Full API reference
- [x] `docs/design-v2-unified-findings.md`: Architecture design
- [x] `docs/design.md`: Original design doc
- [x] `docs/expert-analysis-nexus-toolchain.md`: Nexus toolchain analysis
- [x] `docs/implementation-plan-v2.md`: Detailed implementation plan (635 lines)
- [x] `docs/installation.md`: Installation guide
- [x] `docs/user-guide.md`: User guide
- [x] `security.md`: Security architecture document (474 lines)
- [x] `BACKLOG.md`, `BACKLOG_STATUS.md`: Backlog tracking
- [x] `README.md`: Enhanced with production setup

---

## Deliverables

- [x] Unified findings table with EPSS/CISA KEV enrichment
- [x] Component and occurrence registry
- [x] Report comparison engine
- [x] Mitigation workflow (propose → approve → verify → close)
- [x] Policy violations + trend tracking
- [x] Dashboard MTTR and SLA KPIs
- [x] 5 Nexus IQ frontend pages
- [x] Full backend CRUD for 13 new route files
- [x] Admin, Audit, Committee, Roadmap, SaaS frontend pages
- [x] 7 new test files with ~600+ lines of test code

---

## Tests

| Type | Count | Description |
|------|-------|-------------|
| Backend Unit | 60+ | 7 new test files (enrichment, EPSS, components, occurrences, organizations, report comparison, scan reports) |
| Backend Integration | ~22 | All existing + project fix |
| Backend Functional | ~8 | Health, Nexus, project, security, VEG |
| Frontend | ~2 | security.api.test.ts fix |
| **Total** | **~143** | (same as Sprint 7 — enhancement only, no new sprint-specific test file) |

---

## Known Issues (carried forward)

- Seed migrations 010-012 may triple-count on re-run (no dedup)
- `unified_findings.product_id` is NULL for all 64 records (FK not populated from 014-015)
- 2 pre-existing functional test failures (security.functional.test.ts)
- `&` in project directory breaks npm script resolution on Windows
