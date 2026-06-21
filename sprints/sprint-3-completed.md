# Sprint 3 Completed — Security & Vulnerability Governance

## Summary
Delivered the full Security Governance module with 16 REST endpoints, a comprehensive frontend workspace, and 22 new automated tests (96 total across all sprints).

## What was built

### Backend (4 new files)
- `src/validation/security.schema.ts` — Zod schemas for vulnerabilities, waivers, risk acceptances, SLA incidents
- `src/repositories/security.repo.ts` — Database access for 4 tables (vulnerabilities, waivers, risk_acceptances, sla_incidents) with batch import transaction
- `src/services/security.service.ts` — Business logic with vulnerability status state machine, SLA breach detection, waiver expiry checking, scan import
- `src/routes/security.routes.ts` — 16 endpoints under `/api/security`

### Frontend (3 new files, 2 modified)
- `src/api/security.api.ts` — Typed API client with all 16 endpoints
- `src/hooks/useSecurity.ts` — TanStack Query hooks (14 hooks) with cache invalidation
- `src/pages/SecurityGovernanceWorkspace.tsx` — Full workspace with:
  - Vulnerability registry table (severity badges, SLA overdue highlighting, filters)
  - Waiver management (create/approve/reject with inline forms)
  - Risk acceptance management (create/approve with business impact & mitigation)
  - SLA incidents dashboard (count cards + breach list)
  - Scan import UI (paste JSON → preview → confirm)
  - False positive toggle with explanation modal
- `src/App.tsx` — Wired Security workspace component; placeholder text gated

### Tests (4 new files)
- `backend/tests/unit/security.service.test.ts` — 15 unit tests covering all service methods
- `backend/tests/integration/security.test.ts` — 5 integration tests (auth guard, list, validation, create, 404)
- `backend/tests/functional/security.functional.test.ts` — 2 end-to-end flow tests (false positive flow, waiver approval flow)
- `frontend/tests/security.api.test.ts` — 7 unit tests for API client methods

## API Surface (16 endpoints)

```
GET    /api/security/vulnerabilities               # List with filters
GET    /api/security/vulnerabilities/:id            # Get single vuln
POST   /api/security/vulnerabilities                # Create vuln (SLA future validation)
PATCH  /api/security/vulnerabilities/:id            # Update vuln (status transitions)
POST   /api/security/vulnerabilities/:id/false-positive  # Toggle false positive
GET    /api/security/waivers                        # List waivers
POST   /api/security/waivers                        # Create waiver (links to vuln)
PATCH  /api/security/waivers/:id/approve            # Approve → vuln → WAIVED
PATCH  /api/security/waivers/:id/reject             # Reject
GET    /api/security/risk-acceptances               # List risk acceptances
POST   /api/security/risk-acceptances               # Create RA (links to vuln)
PATCH  /api/security/risk-acceptances/:id/approve   # Approve → vuln → REMEDIATED
GET    /api/security/sla-incidents                  # List SLA incidents
POST   /api/security/sla-incidents                  # Create SLA incident
POST   /api/security/detect-sla-breaches            # Auto-detect overdue vulns
POST   /api/security/check-waiver-expiry            # Auto-expire past waivers
POST   /api/security/import/scan                    # Batch import from scanner JSON
```

## Database
Uses 4 existing tables from migration `003_security_vulnerabilities.sql`:
- `vulnerabilities` — 22 columns, soft-delete, SLA tracking, waived/risk links
- `waivers` — 10 columns, lifecycle (PENDING→APPROVED/REJECTED→EXPIRED)
- `risk_acceptances` — 11 columns, approval links to vuln status
- `sla_incidents` — 12 columns, breach detection

## Test Results
| Type | Count |
|------|-------|
| Backend unit | 15 |
| Backend integration | 5 |
| Backend functional | 2 |
| Frontend unit | 7 |
| **Sprint total** | **29** |
| **Grand total (all sprints)** | **96** |
