# Phase 7 — Frontend Refactoring: VegGovernanceWorkspace

## Goal
Reduce the monolithic `VegGovernanceWorkspace.tsx` from 1290 lines to a thin routing shell (~200 lines) by extracting sub-views and utilities into focused, reusable components.

## Changes

### Architecture
- **Before**: Single file with inline badge rendering, constants, utility functions, and 8+ sub-views all conditionally rendered
- **After**: Shell owns state/hooks/handlers only; UI is delegated to extracted components

### Files Created

| File | Purpose |
|---|---|
| `frontend/src/types/veg.ts` | Shared VEG types (`VegDeal`, `VegDealStats`, `VegRequest`, `VegOpportunity`, `VegContract`, params) |
| `frontend/src/utils/veg.ts` | Constants (`REGIONS`, `BUSINESS_LINES`, `DECISIONS`, `WF_STATUSES`, `WF_TYPES`) + formatters (`fmtNum`, `fmtK`) |
| `frontend/src/components/ui/Badge.tsx` | Reusable badge components: `DecisionBadge`, `SalesBadge`, `StatusBadge`, `TypeBadge`, `DeptSignoffBadge` |
| `frontend/src/components/veg/VegTabBar.tsx` | Tab bar (Deal Register / Workflow Requests) |
| `frontend/src/components/veg/VegDashboardView.tsx` | KPI cards, decisions/business-lines/regions breakdown, charts, top clients/owners |
| `frontend/src/components/veg/VegListView.tsx` | Deal register table with filters, search, pagination, import modal, export CSV |
| `frontend/src/components/veg/VegDetailView.tsx` | Single deal detail with financial breakdown, CRM, Chronos tracking |
| `frontend/src/components/veg/VegCreateEditView.tsx` | Create/edit deal form with react-hook-form + zod |
| `frontend/src/components/veg/VegWorkflowListView.tsx` | Workflow request table with filters, search, pagination |
| `frontend/src/components/veg/VegWorkflowDetailView.tsx` | Full workflow lifecycle: status timeline, department sign-offs, bid/go-no-go decisions, opportunities, contracts |
| `frontend/src/components/veg/VegWorkflowCreateView.tsx` | New workflow request form |

### File Size Impact

| File | Before | After | Reduction |
|---|---|---|---|
| `VegGovernanceWorkspace.tsx` | 1290 lines | 197 lines | **85%** |

The extracted components total ~940 lines across 11 files — comparable to the original but now modular, testable, and independently maintainable.

### Design Decisions
- **Shell owns all state/hooks**: The page component still manages React Query hooks, react-hook-form instances, and handler functions. Sub-components receive data and callbacks as props — no context/store coupling.
- **Badges are shared UI**: Extracted to `components/ui/Badge.tsx` for reuse across Compliance, Risk, Audit, and VEG modules.
- **Constants centralized**: All VEG-specific constants live in `utils/veg.ts`; no more inline arrays.
- **Import modal stays in VegListView**: Self-contained modal state avoids polluting the shell.
- **Type casts in shell**: `as any` casts bridge the gap between `api/veg.api` types and `types/veg` types without modifying the API layer.

## Next Steps
1. Refactor `SecurityGovernanceWorkspace` (476 lines) same pattern
2. Move to **Phase 8 — AI Platform**: LLM integration, risk prediction, anomaly detection
