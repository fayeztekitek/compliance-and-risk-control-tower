# Sprint 9: Classic VEG Workflow Frontend

**Status:** 🟡 In Progress  
**Started:** 2026-06-22  
**Branch:** `sprint-9-veg-workflow`  
**Goal:** Build the missing frontend UI for the existing classic VEG workflow (department sign-offs, bid/go-no-go decisions, opportunities, contracts). Backend + API + hooks already exist — only frontend is missing.

---

## Tasks

### Backend — Aggregated Detail Endpoint
- [ ] Add `VegRequestDetailResponse` type joining request + opportunities + contracts in one call
- [ ] Update `veg.service.ts` `getById()` to return aggregated detail
- [ ] Smoke-test all classic VEG endpoints via Swagger/curl

### Frontend — VEG Request List
- [ ] Add `"workflow"` sub-mode to `VegGovernanceWorkspace.tsx`
- [ ] Tabular list of veg_requests with status badges (DRAFT/SUBMITTED/APPROVED/REJECTED/CONTRACT_SIGNATURE)
- [ ] Type badges (RFI/RFP/NEW_CLIENT_REQUEST/BD_REQUEST/ACC_CODE_CREATION/BID_COMMITTEE_OVERSIGHT)
- [ ] Search by client/title, pagination

### Frontend — VEG Request Create/Edit
- [ ] Form with fields: client, title, type (dropdown), description, opportunity link, owner assignment
- [ ] Zod validation schema matching backend
- [ ] Toast notification on success/error

### Frontend — VEG Request Detail + Workflow
- [ ] Status timeline component (DRAFT→SUBMITTED→APPROVED→CONTRACT_SIGNATURE or REJECTED)
- [ ] Department sign-off panel: 4 cards (finance/sales/product/legal) with approve/reject buttons
- [ ] Bid decision toggle (BID/NO_BID) with confirmation dialog
- [ ] Go/No-Go decision toggle (GO/NO_GO) with reason input
- [ ] Linked opportunities table
- [ ] Linked contracts table

### Frontend — Opportunities & Contracts
- [ ] Inline create form for opportunities under a request
- [ ] Inline create form for contracts under an opportunity
- [ ] Expandable/collapsible sections

### Frontend — Sidebar Integration
- [ ] Add VEG Workflow nav item alongside existing VEG Deal Register
- [ ] Icon + label consistent with theme

---

## Deliverables

- [ ] Classic VEG workflow fully usable from frontend (create → submit → sign-off → bid → go-nogo → opportunity → contract)
- [ ] All 7 VEG Request API hooks consumed by the UI
- [ ] Department sign-offs with 4-card panel
- [ ] Bid/No-Bid and Go/No-Go decisions interactive
- [ ] Opportunities and contracts created inline

---

## Tests

| Type | Count | Description |
|------|-------|-------------|
| Frontend Unit | 8 | Render list, form submission, sign-off actions, bid/go-nogo toggle (mocked API) |
| Backend Regression | ~192 | All existing backend tests must pass |
| Frontend Regression | ~8 | All existing frontend tests must pass |
| TypeScript | 0 | `tsc --noEmit` = zero errors |

## Branch Strategy

```
git checkout -b sprint-9-veg-workflow
# ... develop ...
git checkout main
git merge sprint-9-veg-workflow
```
