# VEG & Nexus IQ — Comprehensive Implementation Plan

## Overview

This plan covers **all remaining features** for the VEG (Vermeg Executive Governance) and Nexus IQ domains, building on top of what's already built:

### Already Built (not in scope)
- **VEG Deals:** Database (migration 022), backend CRUD + 10 aggregate endpoints, full frontend (dashboard/list/detail/create-edit), Excel seed script (2037 rows)
- **Classic VEG Workflow:** Database (migration 002), backend CRUD + sign-off engine + bid/go-nogo + opportunities + contracts, frontend API layer + hooks (unused), 21 tests
- **Nexus IQ Core:** Database (migrations 008, 012–021), sync engine + BullMQ workers, 7 services, 20 API endpoints, 5-page frontend drill-down chain (Overview → Application → Report → Vulnerability → Occurrence), mitigation lifecycle, trend analysis, report comparison
- **Cross-tool:** Unified findings table, EPSS/CISA KEV enrichment, KPI engine with MTTR/SLA, RBAC across 7 roles, 190+ tests

---

## VEG Domain

### V1. Classic VEG Workflow Frontend

Build a dedicated frontend UI for the existing backend workflow (veg_requests + opportunities + contracts).

| Item | Description | Effort |
|------|-------------|--------|
| V1.1 | **VEG Requests List** — Tabular list of all veg_requests with status badges (DRAFT/SUBMITTED/APPROVED/REJECTED/CONTRACT_SIGNATURE), type badges (RFI/RFP/BD_REQUEST/etc.), search by client/title, pagination | 1d |
| V1.2 | **VEG Request Create/Edit** — Form with client, title, type, description, opportunity link, owner assignment, compliance check | 0.5d |
| V1.3 | **VEG Request Detail + Workflow** — Full detail view showing request info, status timeline, department sign-off panel (4 departments: finance/sales/product/legal with approve/reject buttons), bid decision toggle, go/no-go decision toggle, linked opportunities list, linked contracts list | 1.5d |
| V1.4 | **Department Sign-off UI** — Per-department card showing current state (PENDING/APPROVED/REJECTED) with action buttons, auto-approval indicator when all 4 approve | 0.5d |
| V1.5 | **Opportunities & Contracts** — Inline create/list for opportunities under a request, inline create/list for contracts under an opportunity | 0.5d |
| V1.6 | **Tests** — Frontend tests for workflow page (render, sign-off actions, API mocking), regression run of all backend VEG tests | 1d |

**Total V1: ~5 days**

### V2. VEG Deal Enhancements

| Item | Description | Effort |
|------|-------------|--------|
| V2.1 | **CSV/Excel Export** — Export filtered deal list to CSV with all 38 columns | 0.5d |
| V2.2 | **Advanced Charts** — Interactive charts (Recharts): TCV trend over time, decision distribution pie, region/business-line heatmap, year-over-year comparison | 1d |
| V2.3 | **Bulk Edit** — Select multiple deals and batch-update decision/sales_status | 0.5d |
| V2.4 | **VEG KPIs on Executive Dashboard** — Add VEG Deal KPIs (total TCV, won count, avg deal size) to Executive Dashboard | 0.5d |
| V2.5 | **Tests** — VEG Deal frontend tests, repo unit test for veg-deal.repo.ts, regression | 1d |

**Total V2: ~3.5 days**

### V3. VEG Notifications & Integrations

| Item | Description | Effort |
|------|-------------|--------|
| V3.1 | **VEG Event Bus** — Emit events on key VEG actions (request submitted, signed-off, approved, bid decision, go/nogo) for downstream processing | 1d |
| V3.2 | **VEG SLA / Deadline Tracking** — Add due_date to veg_requests, SLA breach detection for approval deadlines, BullMQ worker for daily check | 1d |
| V3.3 | **Tests** — Event bus + SLA tests | 0.5d |

**Total V3: ~2.5 days**

---

## Nexus IQ Domain

### N1. Policy Violations Frontend

Backend migrations (020) and scan_report columns exist but no dedicated frontend or CRUD for policy_rules.

| Item | Description | Effort |
|------|-------------|--------|
| N1.1 | **Policy Rules Backend** — repo (`policyRules.repo.ts` CRUD), service (`policyRules.service.ts`), routes (`GET /api/policy-rules`, `POST`, `PATCH`, `DELETE`) | 1d |
| N1.2 | **Policy Violations Page** — Frontend page with: policy rules list/management, violation summary per application/report, violation trend chart over scan reports | 1.5d |
| N1.3 | **Policy Violation Integration** — Wire policy violations into Nexus Report Detail page (show violations count per report), add violation drill-down | 0.5d |
| N1.4 | **Tests** — Policy rules CRUD tests (backend + frontend), regression | 1d |

**Total N1: ~4 days**

### N2. Compliance Classification (Phase 13)

New migration + service + routes + frontend for regulatory mapping.

| Item | Description | Effort |
|------|-------------|--------|
| N2.1 | **Migration 023** — `compliance_classification` table (framework, control_id, requirement, impact_assessment), `regulatory_mapping` table (severity → framework rules), indexes | 0.5d |
| N2.2 | **Compliance Service** — `compliance.service.ts`: auto-classify findings by severity/type, SLA computation per framework, breach detection | 1d |
| N2.3 | **Compliance Routes + Frontend** — CRUD endpoints, frontend page with compliance matrix view (framework grid), per-finding compliance badges | 1.5d |
| N2.4 | **Tests** — Classification logic unit tests, integration tests, regression | 1d |

**Total N2: ~4 days**

### N3. Multi-Scanner Adapters (Phases 10–12)

Extend the unified findings architecture beyond Nexus IQ to ingest Fortify SSC, SonarQube, and Veracode.

| Item | Description | Effort |
|------|-------------|--------|
| N3.1 | **ScannerHttpClient Base** — Extract common HTTP client from NexusHttpClient: rate limiting, retry/backoff, logging, token masking, connection testing | 1d |
| N3.2 | **Fortify SSC Adapter** — REST client (`fortifyHttpClient.ts`), adapter (`fortifyAdapter.ts`) mapping Fortify priority → severity, sync service + BullMQ worker (6h poll), routes for sync status/trigger | 3d |
| N3.3 | **SonarQube Webhook Handler** — Webhook route (`POST /api/sonarqube/webhook`), adapter mapping BLOCKER/CRITICAL/MAJOR/MINOR → severity, optional poll service | 2d |
| N3.4 | **Veracode Adapter** — HMAC-authenticated REST client, adapter mapping Veracode severities, sync worker | 2d |
| N3.5 | **Tests** — Adapter unit tests (mocked HTTP), integration tests, regression | 1d |

**Total N3: ~9 days**

### N4. Scale Hardening (Phase 14)

Production-readiness for 100K+ findings.

| Item | Description | Effort |
|------|-------------|--------|
| N4.1 | **Monthly Partitioning** — Migration to convert unified_findings to partitioned table by month, maintenance cron | 1.5d |
| N4.2 | **Archive Service** — Move findings >12 months to findings_archive, BullMQ daily cron | 1d |
| N4.3 | **Database Performance Audit** — Query analysis, missing indexes, connection pool tuning | 0.5d |
| N4.4 | **Tests** — Partition + archive tests, regression | 1d |

**Total N4: ~4 days**

### N5. Frontend Integration & E2E (Phase 15)

Move from flat state-based navigation to proper URL routing, add sidebar submenu, comprehensive E2E tests.

| Item | Description | Effort |
|------|-------------|--------|
| N5.1 | **URL Routing** — Convert Nexus drill-down from `useState` to React Router nested routes: `/nexus/app/:appId`, `/nexus/report/:reportId`, `/nexus/vuln/:vulnId`, `/nexus/occurrence/:occId` | 1.5d |
| N5.2 | **Sidebar Submenu** — Add Nexus IQ submenu: Overview, Applications, Reports, Vulnerabilities; add VEG submenu: Deal Register, Workflow Requests | 0.5d |
| N5.3 | **E2E Tests** — Playwright tests: Nexus drill-down chain (Overview → App → Report → Vuln → Occurrence), VEG Deal list/dashboard, VEG Classic workflow (create → sign-off → approve), login/logout with multiple roles | 2.5d |
| N5.4 | **Tests** — All 190+ tests must pass, coverage report, regression sign-off | 0.5d |

**Total N5: ~5 days**

### N6. Notifications & Integrations

| Item | Description | Effort |
|------|-------------|--------|
| N6.1 | **Slack/Email Notifications** — Wire BullMQ `email-notify` queue to actual email transport (Nodemailer), add Slack webhook integration for critical findings | 2d |
| N6.2 | **BullMQ Monitoring UI** — Dashboard page showing queue statuses, job counts, retry/clean actions, recent failures | 1.5d |
| N6.3 | **Nexus Sync Scheduling UI** — Frontend page to configure Nexus IQ sync interval, manual trigger, sync log viewer with status badges | 1d |
| N6.4 | **Alert Rules Engine** — Configurable alert rules (severity >= CRITICAL, CISA KEV = true, EPSS > 0.9), auto-create alerts, push notifications | 2d |
| N6.5 | **Tests** — Notification unit tests, monitoring page tests, regression | 1d |

**Total N6: ~7.5 days**

### N7. UX Polish

| Item | Description | Effort |
|------|-------------|--------|
| N7.1 | **react-hook-form + Zod** — Migrate all forms (mitigation proposal, waiver create, VEG request create/edit, VEG deal create/edit) to react-hook-form with Zod schema validation | 2d |
| N7.2 | **Advanced Pagination** — Page number selector, page size selector (10/25/50/100), total count display on all paginated tables | 1d |
| N7.3 | **Bulk Operations** — Select multiple findings/vulnerabilities, batch assign owner, batch propose mitigation, batch change status | 1.5d |
| N7.4 | **Dark Mode** — CSS variables for theming, theme toggle in sidebar, localStorage persistence, respect OS preference | 1d |
| N7.5 | **Tests** — Form validation tests, bulk operation tests, dark mode toggle test | 1d |

**Total N7: ~6.5 days**

---

## Cross-Cutting

### C1. CI/CD Pipeline

| Item | Description | Effort |
|------|-------------|--------|
| C1.1 | **GitHub Actions Unit Tests** — Backend unit tests on push/PR, frontend unit tests on push/PR | 0.5d |
| C1.2 | **GitHub Actions Integration Tests** — Integration tests with PostgreSQL service container | 0.5d |
| C1.3 | **GitHub Actions Build + Lint** — TypeScript build check, ESLint, frontend build | 0.5d |
| C1.4 | **GitHub Actions E2E** — Playwright E2E tests with backend + frontend servers | 1d |
| C1.5 | **Deploy Pipeline** — Docker build + push, deployment script for staging/production | 1d |

**Total C1: ~3.5 days**

---

## Summary

| Domain | Items | Total Effort |
|--------|-------|-------------|
| VEG Classic Workflow Frontend | 6 items | 5d |
| VEG Deal Enhancements | 5 items | 3.5d |
| VEG Notifications & Integrations | 3 items | 2.5d |
| Nexus Policy Violations Frontend | 4 items | 4d |
| Nexus Compliance Classification | 4 items | 4d |
| Nexus Multi-Scanner Adapters | 5 items | 9d |
| Nexus Scale Hardening | 4 items | 4d |
| Nexus Frontend Integration & E2E | 4 items | 5d |
| Nexus Notifications & Integrations | 5 items | 7.5d |
| UX Polish | 5 items | 6.5d |
| CI/CD Pipeline | 5 items | 3.5d |
| **Grand Total** | **50 items** | **~54.5 days** |
