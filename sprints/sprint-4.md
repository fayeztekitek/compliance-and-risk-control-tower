# Sprint 4: Core API — Projects, Roadmaps, SaaS, Audits

**Duration:** 2 weeks
**Goal:** CRUD APIs for remaining 4 workstreams.

---

## Tasks

### Backend — Project & Roadmap Service
- [ ] `ProjectService.crud()` — full CRUD with budget tracking
- [ ] `ProjectService.submitRTD()` — monthly RTD declaration with deviation calc
- [ ] `ProjectService.getGoLiveReadiness()` — readiness scoring
- [ ] `RoadmapService.crud()` — full CRUD with milestone status
- [ ] `RoadmapService.getProgress()` — aggregated progress %

### Backend — SaaS Governance Service
- [ ] `SaaSGovernanceService.crud()` — full CRUD with lifecycle stage
- [ ] `SaaSGovernanceService.transitionLifecycle()` — ONBOARDING → GO_LIVE → OFFBOARDING
- [ ] `SaaSGovernanceService.submitPrivacyAssessment()` — GDPR checklist + DPO review
- [ ] `SaaSGovernanceService.getReadinessScore()` — go-live readiness calculation

### Backend — Audit & Committee Service
- [ ] `AuditService.crud()` — full CRUD for audits
- [ ] `AuditService.addFinding()` — link finding to audit
- [ ] `AuditService.addCorrectiveAction()` — link CAPA to finding
- [ ] `AuditService.closeCorrectiveAction()` — with evidence description
- [ ] `CommitteeService.crud()` — full CRUD for committees
- [ ] `CommitteeService.addAgendaItem()` — add topic to agenda
- [ ] `CommitteeService.recordDecision()` — outcome, context, owner

### Backend — Contractual Obligation Service
- [ ] `ContractService.crud()` — full CRUD
- [ ] `ContractService.verifyCompliance()` — update compliance status with verifier

### Backend — KPI Engine (aggregation)
- [ ] `KPIEngineService.calculateAll()` — 16 KPI formulas (migrate from current `calculateKPIs()`)
- [ ] `KPIEngineService.calculateKRI()` — 4 KRI thresholds (migrate from current `calculateKRIs()`)

### Backend — API Routes
- [ ] `GET/POST/PATCH/DELETE /api/projects`
- [ ] `POST /api/projects/:id/rtd` — RTD declaration
- [ ] `GET/POST/PATCH/DELETE /api/roadmaps`
- [ ] `GET/POST/PATCH/DELETE /api/saas-applications`
- [ ] `POST /api/saas-applications/:id/privacy-assessment`
- [ ] `POST /api/saas-applications/:id/transition` — lifecycle transition
- [ ] `GET/POST/PATCH/DELETE /api/audits`
- [ ] `POST /api/audits/:id/findings`
- [ ] `POST /api/audits/findings/:id/corrective-actions`
- [ ] `PATCH /api/audits/corrective-actions/:id/close`
- [ ] `GET/POST/PATCH/DELETE /api/committees`
- [ ] `POST /api/committees/:id/agenda`
- [ ] `POST /api/committees/:id/decisions`
- [ ] `GET/POST/PATCH/DELETE /api/contractual-obligations`
- [ ] `POST /api/contractual-obligations/:id/verify`

### Frontend — Workspaces
- [ ] Roadmaps & Projects workspace: RTD deviation charts, budget tracking, go-live badges
- [ ] SaaS Governance workspace: lifecycle stages, GDPR checklist, privacy assessment forms
- [ ] Audits & Contracts workspace: CAPA center, finding list, evidence upload
- [ ] Committees workspace: agenda builder, minutes editor, decision log
- [ ] KPI display in Admin workspace (real-time KPI readout)

---

## Deliverables

- [ ] All 4 workstreams have full CRUD APIs
- [ ] RTD declarations with deviation calculation
- [ ] SaaS lifecycle transitions with guardrails
- [ ] Audit findings → CAPAs → evidence → closure pipeline
- [ ] Committee agenda + minutes + decisions logged

---

## Tests

| Type | Count | Description |
|------|-------|-------------|
| Unit | 6 | RTD deviation, SaaS lifecycle state machine, KPI engine (existing formulas), audit→finding→CAPA linkage, committee decision validation, KRI threshold logic |
| Integration | 5 | CRUD for each workstream, lifecycle transition, committee decision recording |
| Functional | 3 | Full SaaS lifecycle, full audit cycle, full committee cycle |
