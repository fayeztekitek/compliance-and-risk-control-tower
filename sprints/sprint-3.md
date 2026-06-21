# Sprint 3: Core API — Security & Vulnerability Governance

**Duration:** 2 weeks
**Goal:** Full CRUD for vulnerabilities, waivers, risk acceptances, SLA incidents.

---

## Tasks

### Backend — Security Service
- [x] `SecurityService.createVulnerability()` — with scanner enum, SLA date validation
- [x] `SecurityService.updateVulnerability()` — status transitions
- [x] `SecurityService.listVulnerabilities()` — paginated, filterable (severity, scanner, status, product)
- [x] `SecurityService.toggleFalsePositive()` — requires explanation text
- [x] `SecurityService.createWaiver()` — with violation link, expiry
- [x] `SecurityService.approveWaiver()` — updates vulnerability status to WAIVED
- [x] `SecurityService.rejectWaiver()` — keeps vulnerability OPEN
- [x] `SecurityService.createRiskAcceptance()` — with business impact + mitigation plan
- [x] `SecurityService.approveRiskAcceptance()` — updates vulnerability to ACCEPTED
- [x] `SecurityService.listSlaIncidents()` — detect breaches by comparing slaDueDate to now
- [x] `SecurityService.importScan()` — parse Veracode/SonarQube/Fortify CSV/Excel via xlsx
- [x] `SecurityService.syncWithPortal()` — external devops-sec.vermeg.com sync

### Backend — Waiver State Machine
- [x] PENDING → APPROVED / REJECTED (manual)
- [x] APPROVED → EXPIRED (auto via BullMQ cron job)
- [x] Waiver auto-expire check on every read (if past expiryDate)

### Backend — API Routes
- [x] `GET /api/security/vulnerabilities` — list with filters
- [x] `POST /api/security/vulnerabilities` — create
- [x] `PATCH /api/security/vulnerabilities/:id` — update
- [x] `POST /api/security/vulnerabilities/:id/false-positive` — toggle with reason
- [x] `GET /api/security/waivers` — list
- [x] `POST /api/security/waivers` — create
- [x] `PATCH /api/security/waivers/:id/approve` — approve
- [x] `PATCH /api/security/waivers/:id/reject` — reject
- [x] `GET /api/security/risk-acceptances` — list
- [x] `POST /api/security/risk-acceptances` — create
- [x] `PATCH /api/security/risk-acceptances/:id/approve` — approve
- [x] `GET /api/security/sla-incidents` — list breaches
- [x] `POST /api/security/import/scan` — multipart file upload + parse
- [x] `POST /api/security/sync/portal` — trigger external sync

### Frontend — Security Workspace
- [x] Replace localStorage calls with TanStack Query hooks (`useVulnerabilities`, `useWaivers`)
- [x] Vulnerability registry: table with severity badges, scanner icons, SLA overdue highlighting
- [x] Filters: severity (multi-select), scanner, status, target product
- [x] Waiver request form: fields for rationale, expiry date, violation link
- [x] Waiver approve/reject buttons with confirmation modal
- [x] Risk acceptance form: business impact (textarea), mitigation plan (textarea)
- [x] False positive toggle: switch + mandatory explanation modal
- [x] Scan upload UI: file picker → preview parsed results → confirm import
- [x] SLA breach dashboard: count of overdue, list of breached vulnerabilities
- [x] DevOps-Sec sync button with progress indicator

---

## Deliverables

- [x] Full vulnerability CRUD with filtering
- [x] Waiver lifecycle: create → approve → vuln status changes → auto-expire
- [x] Risk acceptance with business impact tracking
- [x] Scan file upload parses and imports correctly
- [x] SLA breaches detected and displayed

---

## Tests

| Type | Count | Description |
|------|-------|-------------|
| Unit | 6 | SLA breach calc, waiver state machine, false positive audit trail, scan CSV parser, risk acceptance approval links vuln, auto-expiry check |
| Integration | 6 | Create vuln, create waiver, approve waiver → vuln status, import scan file, false positive toggle, SLA breach detection |
| Functional | 3 | Vuln → waiver → approve → verify status change; upload scan → see results |
