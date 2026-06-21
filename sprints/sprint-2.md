# Sprint 2: VEG Governance API

**Duration:** 2 weeks
**Goal:** Full CRUD on VEG requests, department sign-off workflow, bid/go decision, opportunity + contract management, CRM sync portal.

---

## Tasks

### Backend — VEG CRUD
- [x] `GET /api/veg` — paginated list with search/filter (status, type, client, text search)
- [x] `GET /api/veg/:id` — single VEG request with nested opportunities + contracts
- [x] `POST /api/veg` — create request (Zod validated)
- [x] `PATCH /api/veg/:id` — update request with status transition validation
- [x] `DELETE /api/veg/:id` — soft delete

### Backend — Workflow Actions
- [x] `PATCH /api/veg/:id/signoff/:department` — department sign-off (finance, sales, product, legal)
- [x] Auto-transition to APPROVED when all 4 departments approve
- [x] `PATCH /api/veg/:id/bid` — set bid decision (BID / NO_BID)
- [x] `PATCH /api/veg/:id/gonogo` — set go/no-go decision (GO / NO_GO)

### Backend — CRM Sync
- [x] `POST /api/veg/batch-sync` — batch upsert from CRM (transactional)

### Backend — Opportunities & Contracts
- [x] `POST /api/veg/:id/opportunities` — create opportunity under a VEG request
- [x] `POST /api/veg/opportunities/:id/contracts` — create contract under an opportunity

### Frontend — VEG Workspace
- [x] List page with search, status/type filter, pagination
- [x] Create/Edit form with all fields
- [x] Detail page with department sign-off buttons
- [x] Bid / Go-No-Go decision controls
- [x] Inline opportunity + contract creation

---

## Deliverables

- [x] Users can create, view, edit, and delete VEG requests
- [x] Department sign-off workflow with auto-approval
- [x] Bid and Go/No-Go decisions tracked
- [x] Opportunities and contracts linked to VEG requests
- [x] CRM batch-sync endpoint for external imports
- [x] RBAC protection: COMPLIANCE_OFFICER+ roles can access VEG

---

## Tests

| Type | Count | Description |
|------|-------|-------------|
| Unit | 12 | Service: list, getById, create, update, status transitions, delete, sign-off, bid, go/nogo, batch sync, opportunities, contracts |
| Integration | 5 | Auth guard, list, search, validation, 404 |
| Functional | 1 | Complete flow: create → sign-off → approve → bid → go → opportunity → contract → delete |
