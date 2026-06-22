# Implementation Plan v3: Unified Security Dashboard (security.md-aligned)

## Source Analysis

This plan incorporates requirements from `backend/security.md` — a comprehensive enterprise security vulnerability dashboard specification based on Sonatype Nexus IQ / Lifecycle. Cross-referenced against current codebase (Phase 1 complete, 141/143 tests passing).

### Security.md Core Model
```
Organization → Application → Scan Report → Vulnerability → Occurrence
                                                          ├── Component/JAR
                                                          ├── Path/Module
                                                          ├── Mitigation
                                                          ├── Accepted Risk
                                                          └── Target Fixed Version
                    └── Report Comparison (New vs Fixed vs Recurring)
```

### Key Design Rules from security.md
- **Distinct ≠ Occurrence:** 1 CVE in 10 paths = 1 distinct vuln + 10 occurrences
- **Decision-making first:** Dashboard for auditability, compliance, executive reporting, operational remediation
- **Trends between reports:** Latest vs previous report comparison is core
- **Component registry:** groupId/artifactId/version/hash tracked separately
- **Full workflow:** Import → Normalize → KPI → Classify → Accept/Mitigate → Close → Report

---

## Execution Order

| Phase | Title | Days | Depends On |
|-------|-------|------|------------|
| **1** | Unified Findings Table + Migration + CRUD | ✅ DONE | Design approved |
| **2** | EPSS Enrichment Worker + CISA KEV | 3 | Phase 1 |
| **3** | Organizations & Applications Model Enhancement | 3 | Phase 1 |
| **4** | Occurrence & Component Registry Tables | 3 | Phase 3 |
| **5** | Report Comparison Engine | 3 | Phase 4 |
| **6** | Nexus IQ Dedicated Frontend (drill-down chain) | 5 | Phase 3+4+5 |
| **7** | Dashboard Enhancements (MTTR, compliance posture, distinct/occurrence KPIs) | 3 | Phase 4+5 |
| **8** | Mitigation & Accepted Risk Workflow (approve/reject/expiry/revalidation) | 3 | Phase 1 |
| **9** | Policy Violation Tracking & Trend Analysis | 3 | Phase 5 |
| **10** | Fortify SSC Adapter | 5 | Phase 2 |
| **11** | SonarQube Webhook Handler | 3 | Phase 1 |
| **12** | Veracode Adapter | 3 | Phase 1 |
| **13** | Compliance Classification Table + Regulatory Mapping | 3 | Phase 1 |
| **14** | Scale Hardening (partitioning, archive, ScannerHttpClient base) | 3 | Phase 2+3+4 |
| **15** | Frontend Integration & E2E Tests | 5 | Phase 6+7+8+9 |

**Total: ~40 days (15 phases, 10 new vs v2 plan)**

---

## Phase 1: Unified Findings Table + Migration + CRUD ✅ COMPLETE

**Status: Code complete, all tests passing (141/143).** Migrations 013–016 need to be run against the DB.

### Files created/modified:
- `backend/migrations/013_unified_findings.sql` + `_down.sql` — enums + table + 11 indexes + `vulnerability_enrichments`
- `backend/migrations/014_migrate_security_vulns.sql` + `_down.sql`
- `backend/migrations/015_migrate_nexus_vulns.sql` + `_down.sql`
- `backend/migrations/016_backward_compat_views.sql` + `_down.sql`
- `backend/src/repositories/unifiedFinding.repo.ts` — 11 methods with `checkTableExists()` guard
- `backend/src/services/unifiedFinding.service.ts` — CRUD + `getCrossToolSummary()` + `enrichFinding()`
- `backend/src/routes/unifiedFinding.routes.ts` — 6 endpoints at `/api/unified-findings`
- Updated: `security.service.ts`, `nexus.service.ts`, `kpi.service.ts`, `export.service.ts`, `riskScore.service.ts`
- Registered in `app.ts`

### Blocked by:
- Run `npm run migrate:up` in backend/ (requires running postgres)
- Fill `NEXUS_IQ_USERNAME`/`NEXUS_IQ_TOKEN` in `backend/.env`

---

## Phase 2: EPSS Enrichment Worker + CISA KEV

**Goal:** Fresh EPSS v2 + CISA KEV feed integration. (Unchanged from v2 plan.)

### Step 2.1 — EPSS API Client
**Files:** `backend/src/services/epssClient.ts`
**Details:**
- Fetch EPSS scores from `https://api.first.org/epss/data?v=2&cve-id=...`
- Fetch CISA KEV from `https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json`
- Cache in `vulnerability_enrichments` table (already exists from Phase 1)

### Step 2.2 — Enrichment Worker
**Files:** `backend/src/services/enrichmentWorker.ts`
**Details:**
- BullMQ worker on `kpi-recalc` queue
- For each unenriched finding, look up CVE in EPSS + CISA KEV
- Store enrichment in `vulnerability_enrichments`

### Step 2.3 — Update Risk Score Service
**Files:** `backend/src/services/riskScore.service.ts`
**Details:**
- Read enrichment from cache instead of placeholders
- Wire CISA KEV binary factor

**Estimated effort:** 3 days

---

## Phase 3: Organizations & Applications Model Enhancement

**Goal:** Align with security.md's `organizations` and `applications` business model. Currently `nexus_products` acts as applications table but lacks business_owner, technical_owner, criticality fields.

### Step 3.1 — Migration 017: Enhance Tables
**Files:** `backend/migrations/017_org_app_enhancement.sql`, `017_org_app_enhancement_down.sql`
**Details:**
- Add `business_owner`, `technical_owner`, `criticality` columns to `nexus_products` (or create `applications` view)
- Create `organizations` table: `id`, `name`, `description`, `compliance_officer`, `created_at`
- Add `organization_id` FK to `nexus_products`
- Create `org_compliance_posture` table for aggregated posture tracking

### Step 3.2 — Organization Service
**Files:** `backend/src/services/organization.service.ts`
**Details:**
- CRUD for organizations
- Compliance posture calculation per org (open vulns, accepted risks, SLA breaches)

### Step 3.3 — Organization Routes
**Files:** `backend/src/routes/organization.routes.ts`
**Details:**
- `GET /api/organizations` — list
- `GET /api/organizations/:id` — detail with apps
- `GET /api/organizations/:id/compliance-posture`
- `GET /api/organizations/:id/applications` — apps under org

### Step 3.4 — Application Enhancement
**Files:** `backend/src/services/nexus.service.ts` (updated)
**Details:**
- Update application endpoints to return business_owner, criticality
- Add `GET /applications/:id/risk-score` (move from product endpoint)
- Add `GET /applications/:id/reports` (list scan reports)

**Estimated effort:** 3 days

---

## Phase 4: Occurrence & Component Registry Tables

**Goal:** security.md requires separating components and occurrences from the inline model in `unified_findings`. This enables distinct vuln vs occurrence counting and component-level tracking.

### Step 4.1 — Migration 018: Component & Occurrence Tables
**Files:** `backend/migrations/018_component_occurrence.sql`, `018_component_occurrence_down.sql`
**Details:**
- `components` table: `id`, `group_id`, `artifact_id`, `version`, `package_url`, `hash`, `license_type`, `created_at`
  - Unique constraint on (group_id, artifact_id, version)
  - Index on package_url for Nexus IQ lookups
- `vulnerability_occurrences` table: `id`, `finding_id` (FK → unified_findings), `component_id` (FK → components), `path`, `module`, `scope`, `first_detected_date`, `last_detected_date`, `occurrence_status`
  - Index on (finding_id, component_id, path) for dedup
  - Index on component_id for component drill-down
- `scan_reports` table: `id`, `application_id`, `report_date`, `report_version`, `scan_type`, `raw_report_id`, `imported_at`, `total_vulnerabilities`, `total_occurrences`
- Migration script: backfill components + occurrences from existing `unified_findings` metadata

### Step 4.2 — Component Service
**Files:** `backend/src/services/component.service.ts`
**Details:**
- `findOrCreateComponent(groupId, artifactId, version)` — dedup by coordinates
- `getComponentsByFinding(findingId)`
- `getTopVulnerableComponents(limit, filters)` — most vulnerable JARs
- `getComponentDetail(componentId)` — affected apps, paths, versions

### Step 4.3 — Occurrence Service
**Files:** `backend/src/services/occurrence.service.ts`
**Details:**
- `listOccurrences(findingId)` — all paths/modules for a vuln
- `countDistinctFindings()` vs `countOccurrences()` — the core separation from security.md
- `getDistinctVulnCount(applicationId)` — de-duplicated by CVE
- `getOccurrenceCount(applicationId)` — total with paths

### Step 4.4 — Update KPI Engine
**Files:** `backend/src/services/kpi.service.ts`
**Details:**
- Add distinct vulnerability count (de-dup by CVE/source_id)
- Add occurrence count (total rows in unified_findings)
- Add affected component count (distinct component_id)
- Add affected application count (distinct application_id)
- Update heatmap to show distinct counts not total rows

### Step 4.5 — Component & Occurrence Routes
**Files:** `backend/src/routes/component.routes.ts`, `backend/src/routes/occurrence.routes.ts`
**Details:**
- `GET /api/components` — list with search by artifact/groupId
- `GET /api/components/:id` — detail
- `GET /api/components/:id/findings` — all vulns for component
- `GET /api/vulnerabilities/:id/occurrences` — paths/modules for vuln

**Estimated effort:** 3 days

---

## Phase 5: Report Comparison Engine

**Goal:** security.md requires latest vs previous report comparison showing new, fixed, and recurring vulnerabilities.

### Step 5.1 — Report Comparison Service
**Files:** `backend/src/services/reportComparison.service.ts`
**Details:**
- `compareReports(latestReportId, previousReportId)` — returns diff object
- `getLatestComparison(applicationId)` — auto-detect latest two reports
- Comparison output:
  - `newVulnerabilities` — in latest but not in previous
  - `fixedVulnerabilities` — in previous but not in latest
  - `recurringVulnerabilities` — in both (still open)
  - `riskEvolution` — risk score delta
  - `severityShift` — count changes per severity

### Step 5.2 — Comparison Routes
**Files:** `backend/src/routes/report.routes.ts`
**Details:**
- `GET /api/reports/:applicationId` — list reports
- `GET /api/reports/:applicationId/latest` — latest report detail
- `GET /api/reports/:applicationId/compare` — latest vs previous
- `GET /api/reports/:applicationId/compare?latest={id}&previous={id}` — explicit

### Step 5.3 — Report List in Nexus Service
**Files:** `backend/src/services/nexus.service.ts`
**Details:**
- Add `getReports(applicationId)` — list scan reports
- Add `getReportDetail(reportId)` — single report with vulns

**Estimated effort:** 3 days

---

## Phase 6: Nexus IQ Dedicated Frontend

**Goal:** Build the full drill-down chain from security.md: Org → App → Report → Vuln → Occurrence. Currently Nexus IQ view is a placeholder.

### Step 6.1 — Nexus Overview Page
**Files:** `frontend/src/pages/NexusOverview.tsx`
**Details:**
- Organization selector dropdown
- Application summary cards with risk scores
- Latest scan date per application
- New/fixed/recurring badges
- KPI bar: distinct vulns | occurrences | affected JARs | accepted risks

### Step 6.2 — Application Detail Page
**Files:** `frontend/src/pages/NexusApplicationDetail.tsx`
**Details:**
- Application info: business_owner, criticality, last scan
- Risk score gauge (RED/ORANGE/GREEN)
- Vulnerability summary by severity
- Report history timeline
- Drill-down: click report → report detail

### Step 6.3 — Report Detail Page
**Files:** `frontend/src/pages/NexusReportDetail.tsx`
**Details:**
- Vulnerability table with: CVE | Severity | Component | Occurrences | Status | Target Fix
- Filters: severity, status, component, CVE
- Compare button → comparison page
- Export CSV

### Step 6.4 — Vulnerability Detail Page
**Files:** `frontend/src/pages/NexusVulnerabilityDetail.tsx`
**Details:**
- Full vuln info: description, CVSS, CWE
- Affected applications list
- Occurrence table: path | module | component | version | status
- Actions: mark false positive, submit risk acceptance, set mitigation target
- Remediation recommendation

### Step 6.5 — Report Comparison Page
**Files:** `frontend/src/pages/NexusReportComparison.tsx`
**Details:**
- Side-by-side: latest vs previous
- New vulnerabilities list (green)
- Fixed vulnerabilities list (red)
- Recurring list (amber)
- Risk score change indicator

### Step 6.6 — Wire Navigation in App.tsx
**Files:** `frontend/src/App.tsx`
**Details:**
- Replace Nexus IQ placeholder with `NexusOverview`
- Add nested routing: `/nexus/app/:id`, `/nexus/report/:id`, `/nexus/vuln/:id`
- Register new page components in `currentView` routing

### Step 6.7 — API Hooks
**Files:** `frontend/src/api/nexus.api.ts` (enhance existing)
**Details:**
- Add hooks for orgs, applications, reports, comparison, occurrences, components

**Estimated effort:** 5 days

---

## Phase 7: Dashboard Enhancements

**Goal:** Enhance the Executive Dashboard to match security.md's KPI list.

### Step 7.1 — New KPIs
**Files:** `backend/src/services/kpi.service.ts`
**Details:**
- **MTTR** (Mean Time to Remediate): AVG(remediated_date - detected_date) for FIXED vulns
- **SLA Breach Rate**: COUNT(sla_due_date < NOW() AND status != 'FIXED') / COUNT(*)
- **Distinct Vulnerability Count**: COUNT(DISTINCT cve_id) — not total rows
- **Occurrence Count**: COUNT(*) total rows
- **Affected JARs Count**: COUNT(DISTINCT component_name)
- **Affected Applications Count**: COUNT(DISTINCT application_id)
- **New vs Fixed Trends**: rolling 6 month new/fixed per month

### Step 7.2 — Compliance Posture per Organization
**Files:** `backend/src/services/organization.service.ts`
**Details:**
- Compliance posture score: (fixed_vulns + accepted_risks) / total_vulns
- Posture grade: GREEN (>90%), AMBER (70-90%), RED (<70%)
- Per-org SLA compliance rate

### Step 7.3 — Enhanced Executive Dashboard
**Files:** `frontend/src/pages/ExecutiveDashboard.tsx`
**Details:**
- Add MTTR KPI card
- Add distinct vs occurrence counter
- Add SLA breach rate gauge
- Add affected JARs / applications counters
- Add compliance posture row per organization

### Step 7.4 — New Dashboard Endpoints
**Files:** `backend/src/routes/dashboard.routes.ts`
**Details:**
- `GET /api/dashboard/mttr` — MTTR by severity
- `GET /api/dashboard/distinct-vs-occurrences` — comparison chart data
- `GET /api/dashboard/compliance-posture` — per-org compliance

**Estimated effort:** 3 days

---

## Phase 8: Mitigation & Accepted Risk Workflow

**Goal:** Full workflow from security.md: submit risk acceptance → approve/reject → set expiry → revalidation.

### Step 8.1 — Migration 019: Mitigations Table
**Files:** `backend/migrations/019_mitigations.sql`, `019_mitigations_down.sql`
**Details:**
- `mitigations` table: `id`, `finding_id` (FK), `mitigation_type` (UPGRADE, PATCH, WORKAROUND, ACCEPT), `target_component_version`, `target_release`, `owner`, `due_date`, `status` (PROPOSED, IN_PROGRESS, VERIFIED, CLOSED), `evidence`, `verified_by`, `verified_date`, `created_at`, `updated_at`
- Add `mitigation_id` FK to `unified_findings`

### Step 8.2 — Enhance Risk Acceptances
**Files:** `backend/src/services/security.service.ts`
**Details:**
- Add approval workflow: SUBMITTED → REVIEWED → APPROVED / REJECTED
- Add expiry date and revalidation flag
- Add revalidation job (BullMQ weekly cron)
- Auto-notify on expiry (log entry for now)

### Step 8.3 — Mitigation Service
**Files:** `backend/src/services/mitigation.service.ts`
**Details:**
- CRUD for mitigations
- `proposeMitigation(findingId, type, targetVersion, owner, dueDate)`
- `approveMitigation(id, approverId)`
- `verifyMitigation(id, evidence)` — closes the mitigation
- `getOverdueMitigations()` — for SLA dashboard

### Step 8.4 — Mitigation Routes
**Files:** `backend/src/routes/mitigation.routes.ts`
**Details:**
- `POST /api/mitigations` — propose
- `PATCH /api/mitigations/:id/approve` — approve
- `PATCH /api/mitigations/:id/verify` — verify with evidence
- `GET /api/mitigations/overdue` — SLA alerts

### Step 8.5 — Mitigation Frontend
**Files:** `frontend/src/pages/NexusVulnerabilityDetail.tsx` (enhance)
**Details:**
- Mitigation proposal form
- Status timeline
- Evidence upload placeholder
- Accepted risk with expiry countdown

**Estimated effort:** 3 days

---

## Phase 9: Policy Violation Tracking & Trend Analysis

**Goal:** Nexus IQ policy violation tracking + per-report trend analysis.

### Step 9.1 — Policy Violation Model
**Files:** `backend/migrations/020_policy_violations.sql`
**Details:**
- Augment `scan_reports` with policy violation summary: `total_policy_violations`, `critical_violations`, `high_violations`
- Create `policy_rules` reference table: `id`, `policy_id`, `name`, `threat_level`, `description`

### Step 9.2 — Trend Analysis Service
**Files:** `backend/src/services/trend.service.ts`
**Details:**
- `getTrend(applicationId, months)` — rolling window of report snapshots
- Trend metrics: distinct vulns per report, severity distribution, risk score trajectory
- `getVulnerabilityVelocity()` — new vulns per week
- Project future risk score based on current velocity

### Step 9.3 — Trend Routes
**Files:** `backend/src/routes/trend.routes.ts`
**Details:**
- `GET /api/trends/applications/:id?v6months` — application risk trajectory
- `GET /api/trends/organizations/:id` — org-level trends
- `GET /api/trends/velocity` — new/fixed/recurring velocity

### Step 9.4 — Trend Charts Frontend
**Files:** `frontend/src/pages/NexusReportComparison.tsx` (enhance)
**Details:**
- Risk score trajectory line chart
- New vs fixed stacked bar chart (per report)
- Severity distribution over time
- Compliance posture trend

**Estimated effort:** 3 days

---

## Phase 10: Fortify SSC Adapter

**Goal:** Ingest Fortify OpenText SAST scan results. (Unchanged from v2 plan Phase 3.)

### Step 10.1 — Fortify HTTP Client
**Files:** `backend/src/services/fortifyHttpClient.ts`
**Details:**
- REST API to `GET /api/v3/projects`
- Pagination for 10K+ issues
- Exponential backoff

### Step 10.2 — Fortify Adapter
**Files:** `backend/src/services/fortifyAdapter.ts`
**Details:**
- Map Fortify priority → unified_severity
- Extract CWE, file path, line number
- Flag PII-related findings

### Step 10.3 — Fortify Sync Service
**Files:** `backend/src/services/fortifySyncService.ts`
**Details:**
- BullMQ worker on `scanner-sync` queue
- Poll every 6 hours
- Batch insert via unifiedFindingRepo.bulkUpsertFindings()

### Step 10.4 — Fortify Routes
**Files:** `backend/src/routes/fortify.routes.ts`
**Details:**
- `GET /api/fortify/sync/status`
- `POST /api/fortify/sync/trigger`

**Estimated effort:** 5 days

---

## Phase 11: SonarQube Webhook Handler

**Goal:** Real-time code quality and security hotspot ingestion. (Unchanged from v2 plan Phase 4.)

### Step 11.1 — SonarQube Webhook Route
**Files:** `backend/src/routes/sonarqube.routes.ts`
**Details:**
- `POST /api/sonarqube/webhook`
- Validate webhook secret
- Extract hotspots and quality gate status

### Step 11.2 — SonarQube Adapter
**Files:** `backend/src/services/sonarqubeAdapter.ts`
**Details:**
- Map BLOCKER/CRITICAL/MAJOR/MINOR/INFO → unified_severity
- Extract rule ID, file path
- Flag GDPR-relevant rules (S5332, S2068)

### Step 11.3 — SonarQube Poll Service
**Files:** `backend/src/services/sonarqubePollService.ts`
**Details:**
- BullMQ worker, poll `GET /api/hotspots/search` every 6h
- Batch insert via unifiedFindingRepo.bulkUpsertFindings()

**Estimated effort:** 3 days

---

## Phase 12: Veracode Adapter

**Goal:** Ingest Veracode SAST/DAST results for Colline. (Unchanged from v2 plan Phase 5.)

### Step 12.1 — Veracode HTTP Client
**Files:** `backend/src/services/veracodeHttpClient.ts`
**Details:**
- REST API with HMAC authentication
- `GET /api/auth/auth/v1/codestream/{appGuid}/findings`

### Step 12.2 — Veracode Adapter
**Files:** `backend/src/services/veracodeAdapter.ts`
**Details:**
- Map Veracode severities → unified_severity
- Add `VERY_HIGH` to severity enum if needed

**Estimated effort:** 3 days

---

## Phase 13: Compliance Classification

**Goal:** Regulatory mapping per finding. (Unchanged from v2 plan Phase 6.)

### Step 13.1 — Migration 021: Compliance Classification
**Files:** `backend/migrations/021_compliance_classification.sql`
**Details:**
- `compliance_classification` table with framework, control_id, requirement, impact_assessment
- Regulatory mapping rules table

### Step 13.2 — Compliance Service
**Files:** `backend/src/services/compliance.service.ts`
**Details:**
- Auto-classify based on severity, PII impact, product type
- SLA computation per framework
- Breach notification triggers

### Step 13.3 — Compliance Routes
**Files:** `backend/src/routes/compliance.routes.ts`
**Details:**
- CRUD for compliance classification
- Report generation by framework

**Estimated effort:** 3 days

---

## Phase 14: Scale Hardening

**Goal:** Production-readiness at 100K+ findings/month. (Unchanged from v2 plan Phase 7.)

### Step 14.1 — ScannerHttpClient Base Class
**Files:** `backend/src/services/scannerHttpClient.ts`
**Details:**
- Extract from NexusHttpClient
- Rate limit config per source tool
- Shared logging, backoff, timeout

### Step 14.2 — Monthly Partitioning
**Files:** `backend/migrations/022_partition_unified_findings.sql`
**Details:**
- Convert unified_findings to partitioned table
- Monthly partition maintenance cron job

### Step 14.3 — Archive Cron Job
**Files:** `backend/src/services/archive.service.ts`
**Details:**
- Move findings >12 months to `findings_archive`
- BullMQ worker on daily cron

**Estimated effort:** 3 days

---

## Phase 15: Frontend Integration & E2E Tests

**Goal:** Wire all new pages into sidebar navigation + Playwright E2E tests.

### Step 15.1 — Sidebar Update
**Files:** `frontend/src/components/layout/Sidebar.tsx`
**Details:**
- Add Nexus IQ submenu: Overview, Applications, Reports, Vulnerabilities
- Add Compliance submenu if needed
- Role-based visibility on new pages

### Step 15.2 — Navigation Integration
**Files:** `frontend/src/App.tsx`
**Details:**
- Switch from flat `currentView` to nested route-based navigation for Nexus drill-down
- URL paths: `/nexus`, `/nexus/app/:id`, `/nexus/report/:id`, etc.

### Step 15.3 — E2E Tests
**Files:** `frontend/tests/nexus-overview.spec.ts`, `frontend/tests/nexus-drilldown.spec.ts`
**Details:**
- Playwright tests for Nexus IQ drill-down chain
- Mock API responses for deterministic testing
- Test distinct vs occurrence counting display

### Step 15.4 — Full Regression
- Run all 143+ backend tests
- Run frontend unit + E2E tests
- Verify no regressions in existing dashboards

**Estimated effort:** 5 days

---

## Timeline Summary

| Phase | Title | Days | Dependencies |
|-------|-------|------|-------------|
| 1 | Unified table + migration | ✅ DONE | — |
| 2 | EPSS enrichment worker | 3 | Phase 1 |
| 3 | Orgs & apps model enhancement | 3 | Phase 1 |
| 4 | Occurrence & component registry | 3 | Phase 3 |
| 5 | Report comparison engine | 3 | Phase 4 |
| 6 | Nexus IQ frontend (5 pages) | 5 | Phase 3+4+5 |
| 7 | Dashboard enhancements | 3 | Phase 4+5 |
| 8 | Mitigation & accepted risk workflow | 3 | Phase 1 |
| 9 | Policy violation & trend analysis | 3 | Phase 5 |
| 10 | Fortify SSC adapter | 5 | Phase 2 |
| 11 | SonarQube webhook handler | 3 | Phase 1 |
| 12 | Veracode adapter | 3 | Phase 1 |
| 13 | Compliance classification | 3 | Phase 1 |
| 14 | Scale hardening | 3 | Phase 2+3+4 |
| 15 | Frontend integration + E2E | 5 | Phase 6+7+8+9 |

**Total: ~40 days** (15 days longer than v2 plan due to security.md additions)

## Cross-Reference: security.md Requirements vs Current State

| security.md Section | Current Status | Phase |
|--------------------|---------------|-------|
| Organizations table | Missing | Phase 3 |
| Applications with owners/criticality | Partial (nexus_products) | Phase 3 |
| Scan reports | Partial (inline only) | Phase 4 |
| Components registry | Inline only | Phase 4 |
| Vulnerability occurrences | Not tracked | Phase 4 |
| Distinct vs occurrence counting | Not separated | Phase 4+7 |
| Report comparison (new/fixed/recurring) | Missing | Phase 5 |
| Org→App→Report→Vuln drill-down UI | Placeholder only | Phase 6 |
| Mitigation target version tracking | Missing | Phase 8 |
| Accepted risk approval workflow | Partial (waivers exist) | Phase 8 |
| MTTR | Missing | Phase 7 |
| SLA breach rate | Missing | Phase 7 |
| Policy violations | Missing | Phase 9 |
| Trend analysis (per-report) | Missing | Phase 9 |
| Compliance posture per org | Missing | Phase 7+13 |

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Old services break when reading from unified_findings instead of old tables | High | Backward-compat views + dual-write during transition |
| EPSS API rate limits (1000 req/day free tier) | Medium | Batch lookups, cache aggressively, paid tier for production |
| Adding 8 new phases increases total delivery time by 60% | Medium | Phases 2-9 can be parallelized; Phase 3+10+11+12+13 all depend only on Phase 1 |
| Nexus IQ API changes break sync | Medium | Raw JSON storage in scan_reports for reprocessing |
| Frontend complexity increases with drill-down chain | Medium | Use reusable table/chart components; existing patterns in ExecutiveDashboard |
| Migration 018 (component/occurrence) is data-heavy | Medium | Run in batches; test on staging first |
