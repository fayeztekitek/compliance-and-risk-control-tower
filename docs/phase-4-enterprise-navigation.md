# Phase 4: Modern Enterprise Navigation

> Status: ✅ Implemented

## Summary

Upgraded Phase 3 navigation with real data global search across all domains, global filter bar, quick actions toolbar, collapsible responsive sidebar, saved views system, and dark/light theme consistency.

## Deliverables

| Deliverable | File | Status |
|-------------|------|--------|
| Backend Global Search API | `backend/src/services/search.service.ts` | ✅ New |
| Backend Search Route | `backend/src/routes/search.routes.ts` | ✅ New |
| Frontend Search API | `frontend/src/api/search.api.ts` | ✅ New |
| Upgraded GlobalSearch (real data) | `frontend/src/components/layout/GlobalSearch.tsx` | ✅ Rewritten |
| Saved Views Store | `frontend/src/store/savedViews.store.ts` | ✅ New |
| Global Filter Store | `frontend/src/store/globalFilter.store.ts` | ✅ New |
| Global Filter Bar | `frontend/src/components/layout/GlobalFilterBar.tsx` | ✅ New |
| Quick Actions Toolbar | `frontend/src/components/layout/QuickActions.tsx` | ✅ New |
| Collapsible Sidebar | `frontend/src/components/layout/Sidebar.tsx` | ✅ Updated |
| Route Registration | `backend/src/app.ts` | ✅ Updated |

## Features Implemented

### 1. Global Search (Real Data)

**Before:** Static page index of 26 routes.

**After:** Real-time search across 11 database tables with 250ms debounce:

| Domain | Table | Fields Searched |
|--------|-------|-----------------|
| VEG Deals | `veg_deals` | client, veg_id, opportunity_crm, business_owner |
| VEG Requests | `veg_requests` | title, client |
| Vulnerabilities | `vulnerabilities` | title, target_product |
| CVEs (Nexus) | `unified_findings` | title, cve_id, component_name |
| Projects | `projects` | name, code |
| Organizations | `organizations` | name |
| Applications | `applications` | name |
| Audits | `audits` | title |
| Committees | `committees` | name |
| SaaS Apps | `saas_applications` | name |
| Users | `users` | name, email |

- Type indicator icons (💰 VEG Deal, 🐛 Vulnerability, 🔒 CVE, etc.)
- Badge display for decision status and CVE IDs
- Keyboard navigation (↑↓→Enter→Esc)
- Result count footer
- Loading spinner during API calls

### 2. Saved Views

- Zustand store with `persist` middleware (localStorage)
- Each view stores: `{ name, page, state, createdAt }`
- Views scoped per page URL
- CRUD operations: save, delete, list by page

### 3. Global Filter Bar

- Toggle-able filter panel below header
- Date range picker (start/end date inputs)
- Keyword filter input
- Active filter indicators (dot on filter button)
- Quick reset button
- Minimal display mode when filter bar is collapsed but filters are active
- Persisted in localStorage

### 4. Quick Actions Toolbar

- 5 common actions in the header (right of breadcrumbs):
  - New VEG Deal
  - Import Scan
  - New Audit
  - Report Vulnerability
  - New Committee
- Color-coded by domain (indigo, red, teal, amber, blue)
- Responsive (labels hidden on small screens)

### 5. Collapsible Sidebar

- Toggle button to collapse sidebar to 56px icon-only mode
- State persisted in localStorage
- Expanded: full 256px with labels, groups, favorites, recent
- Collapsed: icon-only with tooltips on hover
- Chevron icon to re-expand
- Dark mode toggle available in both modes

### 6. Dark/Light Theme

- All new components include `dark:` variants
- Consistent `dark:bg-slate-800/900/950` palette
- `dark:border-slate-700` borders
- Header, sidebar, command palette, filter bar, quick actions all themed

## New Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `backend/src/services/search.service.ts` | 120+ | Multi-table ILIKE search across 11 entities |
| `backend/src/routes/search.routes.ts` | 22 | GET /api/search?q=...&limit=... |
| `frontend/src/api/search.api.ts` | 12 | Frontend API client for search |
| `frontend/src/store/savedViews.store.ts` | 35 | Persisted saved views store |
| `frontend/src/store/globalFilter.store.ts` | 35 | Persisted global filters store |
| `frontend/src/components/layout/GlobalFilterBar.tsx` | 70 | Date range + keyword filter UI |
| `frontend/src/components/layout/QuickActions.tsx` | 38 | Quick action buttons |

## Files Modified

| File | Change |
|------|--------|
| `backend/src/app.ts` | Added search routes import + registration |
| `frontend/src/components/layout/GlobalSearch.tsx` | Rewritten to call real API with debounce, type icons, categories |
| `frontend/src/components/layout/Sidebar.tsx` | Added collapsed/expanded state, icon-only mode, localStorage persistence |
| `frontend/src/components/layout/Header.tsx` | Added QuickActions in header, GlobalFilterBar below header |

## Architecture Decisions

### ADR-009: Backend Global Search as UNION Query Alternative
**Context:** Could use a single UNION query or individual parallel queries.
**Decision:** Individual sequential queries with LIMIT per table. Simpler SQL, no UNION complexity, each query independently optimized with existing indexes.
**Consequence:** Slightly more round-trips but more maintainable and debuggable.

### ADR-010: ILIKE over Full-Text Search
**Context:** PostgreSQL offers `to_tsvector`/`to_tsquery` full-text search.
**Decision:** Use `ILIKE` with `%term%` pattern matching. Simple, no index maintenance, consistent with existing 48 search patterns across the codebase. Migration to full-text search can be a future optimization.
**Consequence:** Good-enough search quality for current data volumes. Can be upgraded to full-text + GIN indexes if performance becomes an issue.

### ADR-011: Sidebar State in localStorage, Not Store
**Context:** Collapsed state could be in Zustand or localStorage.
**Decision:** Direct `localStorage` read/write in the Sidebar component. Avoids adding a store dependency for a single boolean.
**Consequence:** State persists across sessions. Zero boilerplate.

## Next Steps (Phase 5)

Phase 5 should implement the **Dashboard Strategy**:
1. Compliance Executive Dashboard (control pass rate, breaches, upcoming deadlines)
2. Risk Dashboard (KRIs, risk heatmap, risk register summary)
3. Audit Dashboard (findings by status, CAPA completion, upcoming audits)
4. SaaS Dashboard (lifecycle stages, readiness scores, privacy status)
5. Committees Dashboard (upcoming meetings, decisions pending, obligations overdue)
