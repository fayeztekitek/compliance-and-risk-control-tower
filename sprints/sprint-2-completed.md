# Sprint 2 Completed — VEG Governance API

## Summary
Delivered the full VEG Governance module with 11 REST endpoints, a complete frontend workspace, and 18 automated tests.

## What was built

### Backend (4 new files)
- `src/validation/veg.schema.ts` — Zod schemas for all VEG endpoints (create, update, list, sign-off, bid, go/nogo, batch sync, opportunities, contracts)
- `src/repositories/veg.repo.ts` — Database access layer with parameterized queries, transaction support for batch sync, nested opportunity/contract fetching
- `src/services/veg.service.ts` — Business logic with status state machine (DRAFT → SUBMITTED → APPROVED → CONTRACT_SIGNATURE), auto-approval when all 4 departments sign off, NotFoundError/ValidationError handling
- `src/routes/veg.routes.ts` — 11 endpoints under `/api/veg` with auth + RBAC middleware

### Frontend (3 new files, 2 modified)
- `src/api/veg.api.ts` — Typed API client with all endpoints
- `src/hooks/useVegRequests.ts` — TanStack Query hooks with cache invalidation
- `src/pages/VegGovernanceWorkspace.tsx` — Full workspace with list (search/filter/paginate), create/edit form, detail view with sign-off buttons, bid/go controls, inline opportunity + contract creation
- `src/App.tsx` — Wired VEG workspace component; import added; placeholder text replaced with conditional rendering

### Tests (4 new files)
- `backend/tests/unit/veg.service.test.ts` — 12 unit tests covering all service methods (mocked repo)
- `backend/tests/integration/veg.test.ts` — 5 integration tests (auth guard, list, search, validation, 404)
- `backend/tests/functional/veg.functional.test.ts` — 1 end-to-end flow test (create → sign-off → approve → bid → go → opportunity → contract → delete)
- `frontend/tests/veg.api.test.ts` — 7 unit tests for API client methods

### Files modified
- `backend/src/app.ts` — Registered VEG routes under `/api/veg`
- `frontend/src/App.tsx` — Imported and rendered `VegGovernanceWorkspace`
- `sprints/sprint-2.md` — Marked all tasks as complete

## API Surface

```
GET    /api/veg                          # List VEG requests
GET    /api/veg/:id                      # Get single VEG with opportunities + contracts
POST   /api/veg                          # Create VEG request
PATCH  /api/veg/:id                      # Update VEG request (with status transition rules)
DELETE /api/veg/:id                      # Soft delete
PATCH  /api/veg/:id/signoff/:dept        # Department sign-off (finance, sales, product, legal)
PATCH  /api/veg/:id/bid                  # Set bid decision (BID|NO_BID)
PATCH  /api/veg/:id/gonogo               # Set go/nogo decision (GO|NO_GO)
POST   /api/veg/batch-sync               # CRM bulk upsert
POST   /api/veg/:id/opportunities        # Create opportunity
POST   /api/veg/opportunities/:id/contracts  # Create contract
```

## Database
All endpoints backed by `veg_requests` table (18 columns including 4 department state columns). Opportunities and contracts tables linked via foreign keys. Soft delete via `deleted_at` column.
