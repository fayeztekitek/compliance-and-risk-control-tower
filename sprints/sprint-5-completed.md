# Sprint 5 — Nexus IQ & Background Jobs

**Status:** `COMPLETED` ✅  
**Started:** 2026-06-21  
**Completed:** 2026-06-21  
**Branch:** sprint-5 (merged to main via fast-forward)

---

## Deliverables

| Deliverable | Status | Notes |
|-------------|--------|-------|
| BullMQ queue infrastructure (5 queues + workers) | ✅ | nexus-sync, sla-breach, waiver-expiry, email-notify, kpi-recalc |
| Nexus HTTP client (mock + real modes) | ✅ | Exponential backoff, timeout, token masking |
| 8-factor risk score engine | ✅ | CVSSx4, severity, reachability, exploitability, age, criticality, waiver, fix |
| Nexus sync orchestration | ✅ | Transactional bulk upsert |
| Config CRUD + connection test | ✅ | |
| Product + application listing | ✅ | |
| Vulnerability explorer (paginated, filterable) | ✅ | By severity, status, product, app, search |
| Waiver management (list, create) | ✅ | |
| Executive KPI endpoint | ✅ | Snapshot + alerts + product heatmap |
| Product KPI drill-down | ✅ | Risk score, grade, aging, top components |
| Jobs dashboard (status counts) | ✅ | |
| Recurring job scheduling | ✅ | SLA breach hourly, waiver expiry hourly, KPI recalc 15min |
| RBAC integration | ✅ | Uses existing nexus permission (SECURITY_MANAGER+) |
| Migration 008 ready | ✅ | 13 nexus tables + indexes + triggers |

## New Files

| File | Purpose |
|------|---------|
| `backend/src/validation/nexus.schema.ts` | Zod schemas |
| `backend/src/repositories/nexus.repo.ts` | DB access (24 methods) |
| `backend/src/services/riskScore.service.ts` | 8-factor risk score |
| `backend/src/services/nexus.service.ts` | Nexus business logic |
| `backend/src/services/nexusHttpClient.ts` | HTTP client |
| `backend/src/services/queue.service.ts` | BullMQ queue + workers |
| `backend/src/services/kpi.service.ts` | KPI recalculation |
| `backend/src/routes/nexus.routes.ts` | 16 REST endpoints |
| `backend/tests/unit/nexus.service.test.ts` | 11 unit tests |
| `backend/tests/integration/nexus.test.ts` | 6 integration tests |
| `backend/tests/functional/nexus.functional.test.ts` | 3 functional tests |

## Test Results

| Type | Count | Passing |
|------|-------|---------|
| Unit (nexus) | 11 | 11 |
| Integration (nexus) | 6 | 6 |
| Functional (nexus) | 3 | 3 |
| **Sprint total** | **20** | **20** |
| **Grand total** | **123** | **123** |
