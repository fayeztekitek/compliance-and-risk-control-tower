# Enhancement Backlog

Enhancements identified during sprints, deferred to post-sprint-7 for implementation.

---

## Sprint 0 — Foundation
- (none)

## Sprint 1 — Auth & RBAC
- (none)

## Sprint 2 — VEG Governance
- [ ] **Seed data:** Add 30-50 VEG seed records so the list page isn't empty on first load
- [ ] **Pagination UX:** Add page number buttons and page size selector (currently Prev/Next only)
- [ ] **Loading skeletons:** Replace spinner with skeleton rows matching table structure
- [ ] **Error toasts:** Show user-friendly API error messages (Snackbar/toast component)
- [ ] **react-hook-form integration:** Wire up Opportunity/Contract forms with `@hookform/resolvers` for proper validation
- [ ] **Empty state CTA:** Add "Create your first request" button when list is empty

## Sprint 3 — Security Governance
- [ ] **Seed data:** Add vulnerability, waiver, risk acceptance seed records
- [ ] **Real-time SLA breach notifications:** Toast/alert when SLA overdue detected
- [ ] **Scan import UI polish:** Show parse error details, preview rows before import
- [ ] **Bulk operations:** Select multiple vulns for bulk status change or waiver

## Sprint 4 — Projects, Roadmaps, SaaS, Audits
- [ ] **Frontend pages:** Projects list/detail, SaaS lifecycle, audit trail, committee calendar
- [ ] **Seed data:** Add project, roadmap, audit, committee seed records
- [ ] **Gantt chart:** Visual roadmap timeline view
- [ ] **SaaS cost tracking:** Currency conversion, cost trend chart
- [ ] **CAPA evidence upload:** File attachment support for corrective actions

## Sprint 5 — Nexus IQ & Background Jobs
- [ ] **Frontend pages:** Nexus dashboard, product list, vulnerability explorer, waiver manager
- [ ] **BullMQ monitoring UI:** Dashboard showing queue depth, job status, retry counts
- [ ] **Seed data:** Add nexus product, application, vulnerability seed records
- [ ] **Slack/email integration:** Real notifications from email-notify queue
- [ ] **Nexus sync scheduling UI:** Cron expression picker for sync frequency

## Sprint 6 — Executive Dashboard & KPIs
- [ ] **Frontend:** Executive Dashboard workspace page (KPI card grid, 5x5 heatmap, KRI panel, charts)
- [ ] **Recharts integration:** Bar chart (scanner count), area chart (RTD trends), heatmap (severity×age), pie/radar (risk distribution)
- [ ] **Export buttons:** Wire CSV + PDF download buttons in frontend
- [ ] **KPI recalculation job (BullMQ):** Wire up kpi-recalc queue with 15-min cron
- [ ] **Historical KPI archive job:** Daily snapshot persistence
- [ ] **Dashboard cache invalidation:** Bust cache on data mutation events

## Sprint 7 — Final Integration (OpenAPI, Docs, Polish)
- [ ] **OpenAPI spec:** Generate from route metadata (zod-to-openapi or swagger-jsdoc)
- [ ] **TypeScript client:** Generate from OpenAPI spec, replace manual API client
- [ ] **API documentation page:** Swagger UI or Scalar
- [ ] **Error boundaries:** React error boundaries for each workspace
- [ ] **Loading skeletons:** Consistent skeleton loading pattern across all pages
- [ ] **Empty states:** "Create first X" CTA for every list page
- [ ] **Keyboard navigation:** Tab order, shortcuts for common actions
- [ ] **Dark mode:** CSS variable toggle, persist preference
- [ ] **i18n preparation:** Extract strings, add locale switcher
- [ ] **Performance audit:** Lazy load routes, memoize selectors, bundle analysis
