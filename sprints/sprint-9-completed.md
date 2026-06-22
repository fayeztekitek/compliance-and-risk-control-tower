# Sprint 9: Classic VEG Workflow Frontend — COMPLETED

**Status:** ✅ Completed  
**Started:** 2026-06-22  
**Completed:** 2026-06-22  
**Branch:** `sprint-9-veg-workflow` → `main` (merge)

---

## Summary

Sprint 9 built the missing frontend UI for the classic VEG workflow (department sign-offs, bid/go-no-go decisions, opportunities, contracts). The backend, API client, and TanStack Query hooks already existed — only the frontend page was missing. The implementation adds a tabbed interface to the existing `VegGovernanceWorkspace.tsx`, allowing users to switch between "Deal Register" and "Workflow Requests" views.

---

## Tasks Completed

### Backend (Already Done, Verified)
- [x] `veg.service.ts` `getById()` already returns aggregated detail with opportunities + contracts
- [x] All classic VEG endpoints verified via tests (12 unit tests in `veg.service.test.ts`, 5 integration + 1 functional)

### Frontend — VEG Workflow List
- [x] Tabbed interface (Deal Register | Workflow Requests) at top of VegGovernanceWorkspace
- [x] Tabular list of veg_requests with status badges (DRAFT/SUBMITTED/APPROVED/REJECTED/CONTRACT_SIGNATURE)
- [x] Type badges (RFI/RFP/NEW_CLIENT_REQUEST/BD_REQUEST/ACC_CODE_CREATION/BID_COMMITTEE_OVERSIGHT)
- [x] Bid and Go/No-Go status columns
- [x] Search by client/title, filter by status/type, pagination

### Frontend — VEG Request Create
- [x] Create form with fields: title, client, type (dropdown), description, owner ID
- [x] Validation: title and client required, button disabled until valid
- [x] Toast notifications on success/error

### Frontend — VEG Request Detail + Workflow
- [x] Status timeline component (DRAFT→SUBMITTED→APPROVED→CONTRACT_SIGNATURE or REJECTED)
- [x] Department sign-off panel: 4 cards (finance/sales/product/legal) with approve/reject buttons
- [x] Sign-off buttons disabled until request is SUBMITTED
- [x] Bid decision toggle (BID/NO_BID) with visual state
- [x] Go/No-Go decision toggle (GO/NO_GO) with visual state
- [x] Submit button for DRAFT requests (status transition DRAFT→SUBMITTED)
- [x] Delete button

### Frontend — Opportunities & Contracts
- [x] Inline create form for opportunities under a request (name, value, stage)
- [x] Opportunities table with expandable contracts section
- [x] Contract count and signed status per opportunity
- [x] Inline create form for contracts under an opportunity
- [x] Contract display: title, date range, compliance status, SLA commitments

### Frontend — Sidebar Integration
- [x] Added "VEG Workflow" nav item with FileSignature icon
- [x] Same RBAC roles as VEG Governance (ADMIN, COMPLIANCE_OFFICER, RISK_MANAGER, PRODUCT_OWNER, EXECUTIVE_READ_ONLY)
- [x] Clicking "VEG Workflow" opens the Workflow Requests tab directly
- [x] App.tsx updated to pass `initialTab` prop based on sidebar selection

---

## Files Changed

| File | Change |
|------|--------|
| `frontend/src/pages/VegGovernanceWorkspace.tsx` | Rewritten: added workflow tab with list/create/detail views alongside existing deal register (now ~1025 lines) |
| `frontend/src/components/layout/Sidebar.tsx` | Added VEG Workflow nav item with FileSignature icon |
| `frontend/src/App.tsx` | Added `veg-workflow` view routing, passes `initialTab` prop |
| `frontend/tests/veg.api.test.ts` | Added 2 tests: createOpportunity + createContract |

---

## Test Results

| Type | Count | Passing |
|------|-------|---------|
| Backend Unit | 160+ | 160+ (all passing) |
| Backend Integration | ~22 | ~22 (all passing) |
| Backend Functional | ~8 | ~6 (2 pre-existing failures in security.functional.test.ts) |
| Frontend Unit (all) | 24 | 24 (10 VEG API including 2 new) |
| **Total** | **~216** | **~214** (2 pre-existing failures) |

### Pre-existing Known Failures
- `security.functional.test.ts`: false positive toggle + waiver create use old `vulnerabilities` table (bypasses unified_findings)

---

## Key Decisions

1. **Tabbed interface**: Added tabs to the existing `VegGovernanceWorkspace.tsx` rather than creating a separate page — keeps all VEG in one workspace, reuses existing layout patterns
2. **Sidebar split**: Two sidebar items — "VEG Governance" (opens Deal Register) and "VEG Workflow" (opens Workflow Requests tab). Both render the same component with different `initialTab` prop.
3. **Status timeline**: Visual step indicator shows DRAFT→SUBMITTED→APPROVED→CONTRACT_SIGNATURE with color-coded states. REJECTED shown as a separate red bubble.
4. **Auto-approval**: When all 4 departments approve, the backend auto-transitions to APPROVED — frontend shows this by re-rendering after each sign-off mutation.
5. **Opportunity/Contract inline forms**: Rather than modal dialogs, inline forms at the top/bottom of the relevant sections keep the workflow flowing.
6. **`any` type for form state**: Used `Record<string, any>` for Deal form state and cast for Wf form to avoid excessive type boilerplate.
