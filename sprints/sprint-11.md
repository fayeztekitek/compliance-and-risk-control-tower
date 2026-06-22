# Sprint 11: Nexus Policy Violations + Compliance Classification

**Status:** 📋 Planned  
**Branch:** `sprint-11-policy-compliance`  
**Goal:** Build the missing policy violations backend + frontend. Add compliance classification framework for regulatory mapping (PCI-DSS, GDPR, SOX).

---

## Tasks

### Backend — Policy Rules CRUD
- [ ] `policyRules.repo.ts` — full CRUD for `policy_rules` table
- [ ] `policyRules.service.ts` — CRUD + `listByThreatLevel()`, `listByCategory()`
- [ ] `policyRules.routes.ts` — `GET /api/policy-rules`, `POST`, `PATCH /:id`, `DELETE /:id`
- [ ] Register in `app.ts`

### Backend — Policy Violations Endpoint
- [ ] `GET /api/applications/:id/policy-violations` — aggregated violations per scan report

### Backend — Compliance Classification
- [ ] Migration 023: `compliance_classification` table (id, finding_id, framework, control_id, requirement, impact_assessment)
- [ ] Migration 023: `regulatory_mapping` table (id, severity, framework, control_id, sla_days)
- [ ] `compliance.service.ts` — `autoClassify(findingId)`, `getFrameworkSummary(framework)`, `getSLAStatus(findingId)`, `detectBreaches()`
- [ ] `compliance.routes.ts` — `GET /api/compliance/frameworks`, `GET /api/compliance/findings/:id`, `GET /api/compliance/sla-breaches`
- [ ] Register compliance routes in `app.ts`

### Frontend — Policy Rules Management
- [ ] Table of all policy rules with create/edit/delete
- [ ] Filter by threat level and category
- [ ] Confirmation dialog on delete

### Frontend — Policy Violations in Report Detail
- [ ] Violation count and threat level breakdown in NexusReportDetail
- [ ] Link to full violations list

### Frontend — Compliance Matrix Page
- [ ] Grid view: rows = frameworks, columns = severity levels
- [ ] Cells = finding counts with color coding
- [ ] Clickable cells drill into findings

### Frontend — Per-finding Compliance Badges
- [ ] Applicable frameworks + SLA status on vulnerability detail page
- [ ] Color-coded SLA breach indicator

### Frontend — Compliance SLA Breach Alerts
- [ ] List of overdue SLA items with severity, framework, days overdue

---

## Deliverables

- [ ] Policy rules CRUD fully functional with frontend
- [ ] Compliance classification auto-applied to findings
- [ ] Compliance matrix shows framework coverage with drill-down
- [ ] SLA breaches detected and displayed

---

## Tests

| Type | Count | Description |
|------|-------|-------------|
| Backend Unit | 4 | Policy rules CRUD, compliance auto-classify, SLA breach detection |
| Backend Integration | 2 | Policy rules endpoints, compliance endpoints |
| Frontend Unit | 4 | Policy rules page, compliance matrix, compliance badges |
| Regression | ~206 | All Sprint 1–10 tests |

---

## Branch Strategy

```
git checkout -b sprint-11-policy-compliance
# ... develop ...
git checkout main
git merge sprint-11-policy-compliance
```
