# Backlog Status Review

Status against the original `BACKLOG.md` items.

## Theme A: Seed Data (was ❌, now ✅)

| Item | Status | Detail |
|------|--------|--------|
| VEG seed records (30+) | ✅ | `010_seed_veg.sql` — 3 INSERT blocks (veg_requests, opportunities, contracts) |
| Vuln/waiver/risk accept seeds | ✅ | `011_seed_security.sql` — vulnerabilities, waivers, risk_acceptances |
| Nexus seeds | ✅ | `012_seed_nexus.sql` — orgs, products, apps, vulns, sync logs |
| Audit/committee seeds | ✅ | `009_seed_data.sql` |
| Roadmap/project seeds | ✅ | Auto-seeded on startup |

**Note:** Seeds were run multiple times — record counts are tripled (known issue).

## Theme B: Frontend Pages (was all ❌, now mostly ✅)

| Page | Status | Detail |
|------|--------|--------|
| Projects | ❌ | No dedicated Projects page; RoadmapWorkspace.tsx covers roadmap views |
| SaaS Lifecycle | ✅ | SaaSGovernanceWorkspace.tsx — 211 lines |
| Audits | ✅ | AuditWorkspace.tsx — 217 lines |
| Committees | ✅ | CommitteeWorkspace.tsx — 203 lines |
| Nexus IQ | ✅ | 5 dedicated pages (Phase 6) |
| Administration | ✅ | AdminWorkspace.tsx — 199 lines |

## Theme C: Notifications & Integrations — All ❌

- Slack/email wiring unwired
- Real-time SLA alerts unwired
- BullMQ monitoring UI missing
- Nexus sync scheduling UI missing

## Theme D: UX Polish — Mostly ❌

- react-hook-form + zod: in package.json but not consistently used
- Pagination UX: basic Prev/Next only
- Scan import, bulk ops, Gantt, CAPA upload: all ❌
- Keyboard nav, dark mode, i18n, performance: all ❌

## Theme E: Access & Identity — All ❌

- Access reviews, role recalibration, dormant accounts, quarterly audits

## Theme F: Dashboard KPI — Partial

- kpi-recalc queue: exists, enrichment worker boots ✅
- Historical archive, cache invalidation, export wiring ❌

## Theme G: Business Process — All ❌

- Chronos integration, training campaigns, BD Request→ACC code, GDPR monitoring

## Summary (#1-#25 from Backlog Summary Table)

| # | Item | Status | Sprint |
|---|------|--------|--------|
| 1 | Seed data (VEG, Security, Nexus) | ✅ | Sprints 5-8 |
| 2 | Projects frontend page | ❌ | — |
| 3 | SaaS Lifecycle frontend page | ✅ | Sprint 8 |
| 4 | Audits frontend page | ✅ | Sprint 8 |
| 5 | Committees frontend page | ✅ | Sprint 8 |
| 6 | Admin page (users, roles, KPIs) | ✅ | Sprint 8 |
| 7 | Slack/email notifications | ❌ | — |
| 8 | Real-time SLA alerts | ❌ | — |
| 9 | Wire BullMQ kpi-recalc + archive | ❌ | — |
| 10 | Dashboard cache invalidation | ❌ | — |
| 11 | react-hook-form + zod on forms | ❌ | — |
| 12 | Pagination UX (page selector) | ❌ | — |
| 13 | Gantt chart for roadmaps | ❌ | — |
| 14 | Dark mode | ❌ | — |
| 15 | i18n | ❌ | — |
| 16 | Bulk operations (vulns) | ❌ | — |
| 17 | CAPA evidence upload | ❌ | — |
| 18 | Keyboard navigation | ❌ | — |
| 19 | Performance audit | ❌ | — |
| 20 | Access & Identity module | ❌ | — |
| 21 | Chronos integration | ❌ | — |
| 22 | Awareness & training module | ❌ | — |
| 23 | BD Request → ACC code | ❌ | — |
| 24 | Nexus frontend pages | ✅ | Phase 6 |
| 25 | BullMQ monitoring UI | ❌ | — |

**Totals: 8 done, 17 outstanding**
