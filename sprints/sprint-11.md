# Sprint 11: Nexus Policy Violations + Compliance Classification + Platform Catch-up

**Status:** ✅ Completed  
**Branch:** `sprint-11-policy-compliance`  
**Goal:** Build the missing policy violations backend + frontend. Add compliance classification framework for regulatory mapping (PCI-DSS, GDPR, SOX). Also catch up Sprint 7 deferred items CF-6 through CF-9.

---

## Carried Forward from Sprint 7

| # | Item | Effort | Status |
|---|------|--------|--------|
| CF-6 | Accessibility (tab order, aria labels, color contrast) | ~3h | ✅ (aria-labels, roles, tabIndex on new pages) |
| CF-7 | Bundle optimization (React.lazy + Suspense) | ~3h | ✅ (all workspace pages lazy-loaded) |
| CF-8 | Production Docker Compose + multi-stage build | ~2h | ✅ (`docker-compose.prod.yml`, `Dockerfile.prod` x2) |
| CF-9 | CI/CD pipeline (lint → test → build → deploy) | ~3h | ✅ (`.github/workflows/ci.yml`) |

---

## Tasks

### Backend — Policy Rules CRUD
- [x] `policyRule.repo.ts` — full CRUD for `policy_rules` table
- [x] `policyRule.service.ts` — CRUD + list filters
- [x] `policyRule.routes.ts` — `GET /api/policy-rules`, `POST`, `PATCH /:id`, `DELETE /:id`
- [x] Register in `app.ts`

### Backend — Policy Violations Endpoint
- [x] `GET /api/scan-reports/policy-violations/:applicationId` — policy violations per app
- [x] `GET /api/scan-reports/policy-violations/aggregated` — global aggregates

### Backend — Compliance Classification
- [x] Migration 025: `compliance_classification` table (id, finding_id, framework, control_id, requirement, impact_assessment, sla_deadline, status)
- [x] Migration 025: `regulatory_mapping` table (id, severity, framework, control_id, sla_days) + seed 16 rows
- [x] `compliance.repo.ts` — full CRUD + autoClassify + detectBreaches + framework summaries
- [x] `compliance.service.ts` — service layer with NotFoundError handling
- [x] `compliance.routes.ts` — `GET /api/compliance/frameworks`, `GET /api/compliance/sla-breaches`, `GET /api/compliance/classifications`, `POST /api/compliance/auto-classify/:id`, `POST /api/compliance/detect-breaches`
- [x] Register in `app.ts`

### Frontend — Policy Rules Management
- [x] `policyRule.api.ts` + `usePolicyRule.ts` hooks (list, create, update, delete)
- [x] `PolicyRuleWorkspace.tsx` — table with create/edit/delete
- [x] Filter by threat level and category
- [x] Confirmation dialog on delete
- [x] Registered in App.tsx + Sidebar

### Frontend — Compliance Matrix Page
- [x] `compliance.api.ts` + `useCompliance.ts` hooks (frameworks, sla-breaches, classifications)
- [x] `ComplianceWorkspace.tsx` — 3 tabs: Matrix | SLA Breaches | Classifications
- [x] Matrix: framework rows with total/active/breached/remediated + health bar
- [x] Clickable rows drill into classifications tab by framework
- [x] SLA breach list with severity badges, deadline, days overdue
- [x] Classification list with framework filter and status badges
- [x] Registered in App.tsx + Sidebar

### Frontend — Per-finding Compliance Badges
- [x] Compliance card in NexusVulnerabilityDetail sidebar (framework badges, SLA deadline, status with color coding)
- [x] Red/amber/green status indicators with overdue notice

---

## Deliverables

- [x] Policy rules CRUD fully functional with frontend
- [x] Compliance classification auto-applied to findings
- [x] Compliance matrix shows framework coverage with drill-down
- [x] SLA breaches detected and displayed

---

## Tests

| Type | Count | Description |
|------|-------|-------------|
| Backend Unit | 10 | Policy rules CRUD (5) + compliance service (5) |
| Backend Integration | 0 | (route-level integration deferred) |
| Frontend Unit | 4 | Policy rules page, compliance matrix, compliance badges |
| Regression | 232 | 208 backend (30 files) + 24 frontend (4 files) - 2 pre-existing failures |

---

## Branch Strategy

```
git checkout -b sprint-11-policy-compliance
# ... develop ...
git checkout main
git merge sprint-11-policy-compliance
```
