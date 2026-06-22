# Enhancement Backlog — Consolidated Plan

Enhancements identified from deferred backlog + original spec gaps, organized into themes.

---

## Theme A: Seed Data & Demo Readiness

Priority: High | Effort: Low | Dependency: None

| Item | Origin | Status |
|------|--------|--------|
| 30-50 VEG seed records (requests, opps, contracts) | Backlog Sprint 2 | ❌ |
| Vulnerability, waiver, risk acceptance seed records | Backlog Sprint 3 | ❌ |
| Nexus product, application, vulnerability seed records | Backlog Sprint 5 | ❌ |
| Audit, committee, finding seed records | Backlog Sprint 4 | ✅ (009_seed_data.sql exists) |
| Roadmap/project seed data | Original spec | ✅ (auto-seeded on startup) |

**Files affected:** `backend/migrations/010_seed_veg.sql`, `011_seed_security.sql`, `012_seed_nexus.sql`

---

## Theme B: Missing Frontend Pages

Priority: High | Effort: High | Dependency: Backend APIs exist

| Page | Backend Ready | Frontend |
|------|-------------|----------|
| **Projects** — list, detail, RTD review, budget view | ✅ Sprint 4 | ❌ |
| **SaaS Lifecycle** — onboarding/go-live/offboarding, readiness score | ✅ Sprint 4 | ❌ |
| **Audits** — plan, evidence, findings, CAPA | ✅ Sprint 4 | ❌ |
| **Committees** — calendar, agenda, decisions, minutes | ✅ Sprint 4 | ❌ |
| **Nexus IQ** — product list, vuln explorer, waiver manager, sync dashboard | ✅ Sprint 5 | ❌ |
| **Administration** — users, roles, permissions, KPI thresholds | ✅ Sprint 1 | ❌ |

**Implementation pattern for each page:**
- `frontend/src/api/{module}.api.ts` — API client
- `frontend/src/hooks/use{Module}.ts` — TanStack Query hooks
- `frontend/src/pages/{Module}/...` — React pages with search/filter/pagination
- `frontend/src/components/ui/` — reused Skeleton, EmptyState, Toast, ErrorBoundary

**Estimated effort:** 2–3 pages per sprint, ~3 sprints total.

---

## Theme C: Notifications & Integrations

Priority: Medium | Effort: High | Dependency: BullMQ queues already defined

| Item | Backend | Frontend |
|------|---------|----------|
| **Slack integration** for email-notify queue | ✅ queue exists, unwired | ❌ webhook config |
| **Email sending** (nodemailer or SendGrid) | ✅ queue exists, unwired | ❌ |
| **Real-time SLA breach alerts** → toast/notification | ❌ service logic partial | ❌ |
| **BullMQ monitoring UI** (queue depth, job status, retry) | ❌ | ❌ (use Bull Board or custom) |
| **Nexus sync scheduling UI** (cron picker) | ❌ | ❌ |

**Architecture:** Wire BullMQ workers → add notification router → frontend polls SSE or uses WebSocket for real-time alerts.

---

## Theme D: UX Polish & Enterprise Features

Priority: Medium | Effort: Medium | Dependency: None

| Item | Origin | Notes |
|------|--------|-------|
| react-hook-form + zod resolver on all forms | Backlog Sprint 2 | Replace manual `useState` |
| Pagination UX — page buttons, page size selector | Backlog Sprint 2 | Currently Prev/Next only |
| Scan import UI — parse errors, preview rows | Backlog Sprint 3 | Currently basic textarea |
| Bulk operations — select vulns, bulk status/waiver | Backlog Sprint 3 | ❌ |
| Gantt chart for roadmap timeline | Backlog Sprint 4 | Use `@neodrag/gantt` or similar |
| SaaS cost tracking — currency, trend chart | Backlog Sprint 4 | ❌ |
| CAPA evidence file upload | Backlog Sprint 4 | ❌ |
| Keyboard navigation — tab order, shortcuts | Backlog Sprint 7 | ❌ |
| Dark mode — CSS variables, persist preference | Backlog Sprint 7 | ❌ |
| i18n — extract strings, locale switcher | Backlog Sprint 7 | ❌ |
| Performance audit — lazy routes, memoize, bundle analysis | Backlog Sprint 7 | ❌ |

---

## Theme E: Access & Identity Management

Priority: Medium | Effort: High | Dependency: New module

| Item | Description |
|------|-------------|
| **Access review module** — least privilege checks | New tables: `access_reviews`, `access_findings`, `dormant_accounts` |
| **Role change recalibration** — auto-revoke on role change | ❌ |
| **Dormant account detection** — 90d inactivity threshold | ❌ |
| **Staff/subcontractor access audits** — quarterly workflow | Original spec — quarterly audits |

---

## Theme F: Dashboard & KPI Hardening

Priority: Low | Effort: Medium | Dependency: None

| Item | Notes |
|------|-------|
| Wire kpi-recalc BullMQ queue with 15-min cron | Queue exists, worker unwired |
| Historical KPI snapshot archive job (daily) | ❌ |
| Dashboard cache invalidation on data mutation | ❌ |
| Export buttons wire CSV + PDF in frontend | Backend endpoints exist, frontend buttons exist but unwired |

---

## Theme G: Business Process Features (Original Spec Gaps)

Priority: Low | Effort: High | Dependency: Business requirements

| Item | Description |
|------|-------------|
| **Chronos integration** — man-days monitoring, auto-create project after contract signature | External system API |
| **Awareness & training campaigns** — e-learning module, target audience tracking | New module |
| **BD Request → ACC code creation** — workflow extension | Extends VEG workflow |
| **Privacy by Design / GDPR** — "to be initiated" items | Extends SaaS privacy module |
| **Continuous monitoring** — real-time control effectiveness | Requires dashboard refresh |

---

## Proposed Sprint Plan

| Sprint | Theme | Deliverables |
|--------|-------|-------------|
| **Sprint 8** | **A + B (first half)** | Seed data all modules + Projects frontend + SaaS frontend |
| **Sprint 9** | **B (second half)** | Audits frontend + Committees frontend + Admin page |
| **Sprint 10** | **C + F** | Notifications (Slack/email/SLA), BullMQ wiring, dashboard hardening |
| **Sprint 11** | **D** | UX polish (forms, pagination, Gantt, bulk, dark mode, i18n) |
| **Sprint 12** | **E + G** | Access & Identity module + Business process features |
| **Sprint 13** | **Nexus frontend** | Nexus product/vuln/waiver/sync pages |

---

## Summary of All Incomplete Items

| # | Item | Priority | Effort | Sprint |
|---|------|----------|--------|--------|
| 1 | Seed data (VEG, Security, Nexus) | 🔴 High | Small | 8 |
| 2 | Projects frontend page | 🔴 High | Medium | 8 |
| 3 | SaaS Lifecycle frontend page | 🔴 High | Medium | 8 |
| 4 | Audits frontend page | 🔴 High | Medium | 9 |
| 5 | Committees frontend page | 🔴 High | Medium | 9 |
| 6 | Admin page (users, roles, KPIs) | 🔴 High | Medium | 9 |
| 7 | Slack/email notifications | 🟡 Medium | Medium | 10 |
| 8 | Real-time SLA alerts | 🟡 Medium | Medium | 10 |
| 9 | Wire BullMQ kpi-recalc + archive | 🟡 Medium | Small | 10 |
| 10 | Dashboard cache invalidation | 🟡 Medium | Small | 10 |
| 11 | react-hook-form + zod on forms | 🟡 Medium | Medium | 11 |
| 12 | Pagination UX (page selector) | 🟡 Medium | Small | 11 |
| 13 | Gantt chart for roadmaps | 🟢 Low | Medium | 11 |
| 14 | Dark mode | 🟢 Low | Small | 11 |
| 15 | i18n | 🟢 Low | Medium | 11 |
| 16 | Bulk operations (vulns) | 🟡 Medium | Medium | 11 |
| 17 | CAPA evidence upload | 🟢 Low | Small | 11 |
| 18 | Keyboard navigation | 🟢 Low | Small | 11 |
| 19 | Performance audit | 🟢 Low | Small | 11 |
| 20 | Access & Identity module | 🟡 Medium | Large | 12 |
| 21 | Chronos integration | 🟢 Low | Large | 12 |
| 22 | Awareness & training module | 🟢 Low | Large | 12 |
| 23 | BD Request → ACC code | 🟢 Low | Medium | 12 |
| 24 | Nexus frontend pages | 🟡 Medium | Large | 13 |
| 25 | BullMQ monitoring UI | 🟢 Low | Medium | 13 |
