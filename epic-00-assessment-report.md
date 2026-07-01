# EPIC-00 — Current State Assessment Report

## 1. Architecture Overview

### Frontend
- **Framework**: React 18 + TypeScript with Vite bundler
- **Routing**: React Router v6 with lazy-loaded pages via `React.lazy()`
- **State**: TanStack Query (data fetching), Zustand (auth, page context, favorites)
- **Styling**: Tailwind CSS v4 with `@tailwindcss/vite` plugin
- **Components**: 43 page files, 43 component files (7 layout, 8 UI primitives, 16 VEG, 8 executive, 1 chart, 3 miscellaneous)
- **Proxy**: Vite dev server proxies `/api` to backend (configurable via `API_PROXY_TARGET`)
- **Build guard**: `blockMockDataPlugin` prevents production builds using mock data

### Backend
- **Runtime**: Node.js + ESM (`"type": "module"`)
- **Framework**: Express 4.21 with Zod validation
- **Language**: TypeScript ~5.8, compiled via esbuild
- **Database**: PostgreSQL 13+ via `pg` 8.13
- **Cache/Queue**: Redis via `ioredis`, BullMQ 5.79 for job queues
- **Auth**: JWT Bearer tokens with bcryptjs password hashing
- **AI**: `@google/genai` 2.10 (Gemini SDK)
- **Export**: `xlsx` 0.18 for Excel, nodemailer for email
- **Logging**: Pino 9.6
- **API Docs**: Swagger UI via swagger-jsdoc + swagger-ui-express

### Database
- **Engine**: PostgreSQL with `pgcrypto` and `uuid-ossp` extensions
- **Migrations**: 68 SQL files (39 up + 29 down), executed in filename sort order
- **Tables**: ~40 tables across domains (users, VEG, security, roadmaps, projects, SaaS, privacy, audits, committees, nexus, unified findings, policies, mitigations, compliance, alerts, prompt library, knowledge base, conversation history, agent logs, MCP connectors, report schedules, pipeline runs, teams, audit logs)

---

## 2. Frontend Route Inventory

| # | Path | Component | Status |
|---|------|-----------|--------|
| 1 | `/login` | `LoginPage` | ✅ Unauthenticated |
| 2 | `/dashboard` | `ExecutiveDashboard` | ✅ |
| 3 | `/executive/reports` | `ReportsPage` | ✅ |
| 4 | `/executive/alerts` | `ExecutiveDashboard` | ✅ (same as dashboard) |
| 5 | `/organizations` | `OrganizationsPage` | ✅ |
| 6 | `/applications` | `ApplicationsPage` | ✅ |
| 7 | `/veg` | `VegGovernanceWorkspace` | ✅ |
| 8 | `/veg/list` | `VegGovernanceWorkspace` | ✅ |
| 9 | `/veg/deal/:dealId` | `VegGovernanceWorkspace` | ✅ |
| 10 | `/veg/workflow` | `VegGovernanceWorkspace` | ✅ |
| 11 | `/veg/dashboard` | `VegComexDashboard` | ✅ |
| 12 | `/veg/decisions` | `VegGovernanceWorkspace` | ✅ |
| 13 | `/veg/negotiation` | `VegGovernanceWorkspace` | ✅ |
| 14 | `/veg/documents` | `VegGovernanceWorkspace` | ✅ |
| 15 | `/veg/actions` | `VegGovernanceWorkspace` | ✅ |
| 16 | `/security` | `SecurityGovernanceWorkspace` | ✅ |
| 17 | `/security/dashboard` | `SecurityDashboard` | ✅ |
| 18 | `/vulnerabilities` | `VulnerabilitiesPage` | ✅ |
| 19 | `/risk-management` | `RiskManagementPage` | ✅ |
| 20 | `/waived-accepted-risks` | `WaivedAcceptedRisksPage` | ✅ |
| 21 | `/policy-rules` | `PolicyRuleWorkspace` | ✅ |
| 22 | `/reports` | `ReportsPage` | ✅ |
| 23 | `/nexus` | `NexusOverview` | ✅ |
| 24 | `/nexus/app/:appId` | `NexusAppDetail` | ✅ |
| 25 | `/nexus/report/:reportId` | `NexusReportDetail` | ✅ |
| 26 | `/nexus/compare` | `NexusReportComparison` | ✅ |
| 27 | `/nexus/evolution/:appId` | `NexusEvolutionTimeline` | ✅ |
| 28 | `/nexus/vuln/:vulnId` | `NexusVulnerabilityDetail` | ✅ |
| 29 | `/nexus/occurrence/:occId` | `NexusOccurrenceDetail` | ✅ |
| 30 | `/roadmaps` | `RoadmapWorkspace` | ✅ |
| 31 | `/roadmaps/dashboard` | `RoadmapsDashboard` | ✅ |
| 32 | `/saas` | `SaaSGovernanceWorkspace` | ✅ |
| 33 | `/saas/dashboard` | `SaaSDashboard` | ✅ |
| 34 | `/compliance` | `ComplianceWorkspace` | ✅ |
| 35 | `/compliance/dashboard` | `ComplianceDashboard` | ✅ |
| 36 | `/compliance/controls` | `ComplianceWorkspace` | ✅ |
| 37 | `/audits` | `AuditWorkspace` | ✅ |
| 38 | `/audits/dashboard` | `AuditDashboard` | ✅ |
| 39 | `/committees` | `CommitteeWorkspace` | ✅ |
| 40 | `/committees/dashboard` | `CommitteesDashboard` | ✅ |
| 41 | `/risk/dashboard` | `RiskDashboard` | ✅ |
| 42 | `/risk/register` | `RiskDashboard` | ✅ (same component) |
| 43 | `/admin` | `AdminWorkspace` | ✅ |
| 44 | `/ai` | `AiHubPage` | ✅ |
| 45 | `/ai/prompts` | `PromptLibraryPage` | ✅ |
| 46 | `/ai/agents` | `AiAgentsPage` | ✅ |
| 47 | `/ai/copilot/:type` | `CopilotChatPage` | ✅ |
| 48 | `/ai/knowledge-base` | `KnowledgeBasePage` | ✅ |
| 49 | `/ai/connectors` | `McpConnectorsPage` | ✅ |
| 50 | `/reports/engine` | `ReportEnginePage` | ✅ |
| 51 | `/pipelines` | `PipelinesPage` | ✅ |

**Missing vs target navigation:**
- `/projects` → No Projects Monitoring page exists
- `/projects/dashboard` → No Project Dashboard
- Roadmaps and Projects are combined under a single "Roadmaps & Projects" sidebar group

---

## 3. Backend API Route Inventory

| Prefix | Route File | Purpose |
|--------|-----------|---------|
| `/api/auth` | `auth.routes.ts` | Login, register, token refresh |
| `/api/veg` | `veg.routes.ts` | VEG governance CRUD |
| `/api/veg-deals` | `veg-deal.routes.ts` | VEG deals management |
| `/api/security` | `security.routes.ts` | Security vulnerabilities CRUD |
| `/api` (projects) | `project.routes.ts` | Projects and roadmaps CRUD |
| `/api/nexus` | `nexus.routes.ts` | Nexus IQ data |
| `/api/dashboard` | `dashboard.routes.ts` | Executive dashboard data |
| `/api/dashboard-pages` | `dashboardPages.routes.ts` | Per-domain dashboard data |
| `/api/export` | `export.routes.ts` | CSV/Excel export |
| `/api/audits` | `audit.routes.ts` | Audit CRUD |
| `/api/committees` | `committee.routes.ts` | Committee CRUD |
| `/api/admin` | `admin.routes.ts` | Users, teams, audit log, health |
| `/api/unified-findings` | `unifiedFinding.routes.ts` | Cross-tool finding store |
| `/api/finding-components` | `findingComponent.routes.ts` | Component analysis |
| `/api/finding-occurrences` | `findingOccurrence.routes.ts` | Occurrence tracking |
| `/api/scan-reports` | `scanReport.routes.ts` | Scan reports |
| `/api/reports` | `report.routes.ts` | Legacy reports |
| `/api/trends` | `trend.routes.ts` | Trend analysis |
| `/api/mitigations` | `mitigation.routes.ts` | Mitigation tracking |
| `/api/policy-rules` | `policyRule.routes.ts` | Policy rule CRUD |
| `/api/compliance` | `compliance.routes.ts` | Compliance management |
| `/api/fortify` | `fortify.routes.ts` | Fortify data |
| `/api/sonarqube` | `sonarqube.routes.ts` | SonarQube data + sync |
| `/api/veracode` | `veracode.routes.ts` | Veracode data |
| `/api/archive` | `archive.routes.ts` | Archival operations |
| `/api/alert-rules` | `alert.routes.ts` | Alert rule CRUD |
| `/api/admin/queues` | `queue.routes.ts` | BullMQ queue monitoring |
| `/api` (search) | `search.routes.ts` | Global search |
| `/api` (notifications) | `notification.routes.ts` | Notification CRUD |
| `/api` (engine-report) | `engine-report.routes.ts` | Report engine CRUD + schedules |
| `/api` (dashboards) | Various `*-dashboard.routes.ts` | Per-domain dashboard endpoints |
| `/api/ai` | `ai.routes.ts` | AI hub listing |
| `/api/prompts` | `promptLibrary.routes.ts` | Prompt library CRUD |
| `/api/ai/agents` | `agent.routes.ts` | Agent chat, runs, recommendations |
| `/api/ai/copilots` | `copilot.routes.ts` | Copilot chat (SSE + JSON) |
| `/api/knowledge-base` | `knowledgeBase.routes.ts` | KB CRUD |
| `/api/chatbot` | `chatbot.routes.ts` | Chatbot conversation CRUD |
| `/api/mcp` | `mcp.routes.ts` | MCP connector CRUD + test/sync |
| `/api/rag` | `rag.routes.ts` | RAG search + re-embed |
| `/api/pipelines` | `pipeline.routes.ts` | Pipeline webhooks + CRUD |

**All 47 route files are registered**.

---

## 4. Reusable Component Inventory

### UI Primitives (`components/ui/`)
| Component | Props | Status |
|-----------|-------|--------|
| `Badge` | Variants: DecisionBadge, SalesBadge, StatusBadge, TypeBadge, DeptSignoffBadge | ✅ |
| `BulkActionsToolbar` | selectedCount, actions[], danger variant | ✅ |
| `DataSourceIndicator` | source label, status | ✅ |
| `EmptyState` | icon, title, description, optional CTA | ✅ |
| `ErrorBoundary` | fallback, retry | ✅ |
| `ExportButton` | data, filename | ✅ |
| `FormField` + `FormInput` + `FormSelect` + `FormTextarea` | label, error, rhf registration | ✅ |
| `Pagination` | page, totalPages, onChange | ✅ |
| `Skeleton` | SkeletonPage, SkeletonCard, SkeletonTable | ✅ |
| `Toast` | ToastContainer, useToast | ✅ |

### Executive Components (`components/executive/`)
| Component | Used In | Status |
|-----------|---------|--------|
| `KpiCard` | ExecutiveDashboard | ✅ (reusable pattern) |
| `OrganizationCard` | ExecutiveDashboard | ✅ |
| `OrganizationDrilldown` | ExecutiveDashboard | ✅ |
| `FilterPanel` | ExecutiveDashboard | ✅ |
| `SeverityDonut` | ExecutiveDashboard | ✅ |
| `RiskDonut` | ExecutiveDashboard | ✅ |
| `TrendLineChart` | ExecutiveDashboard | ✅ |
| `TopAppsTable` | ExecutiveDashboard | ✅ |
| `LatestScansTable` | ExecutiveDashboard | ✅ |

### VEG Components (`components/veg/`)
16 dedicated components (dashboard, list, detail, filter, charts, kpi cards, workflow, risk alerts, tab bar).

### Layout Components
| Component | Status |
|-----------|--------|
| `Sidebar` | ✅ (collapsible, favorites, recent, dark mode, role-based filtering) |
| `Header` | ✅ |
| `GlobalFilterBar` | ✅ |
| `GlobalSearch` | ✅ (Cmd+K search) |
| `ProtectedRoute` | ✅ |
| `QuickActions` | ✅ |
| `ChatbotWidget` | ✅ (floating panel with SSE) |

---

## 5. Sidebar Menu vs Target Navigation

### Existing Sidebar Groups (11 groups, 35 items)
1. **Executive** — Dashboard, COMEX Dashboard, Reports, Alerts
2. **Organizations** — Organizations, Applications, Nexus IQ
3. **VEG Governance** — COMEX Dashboard, Deal Register, Negotiation, Documents, Action Tracker
4. **Security Governance** — Dashboard, Vulnerabilities, Risk Mgmt, Waived/Accepted, Policy Rules, Reports, Report Engine, Security Console
5. **Roadmaps & Projects** — Dashboard, Roadmaps *(combined group)*
6. **SaaS Governance** — Dashboard, SaaS Applications
7. **Compliance** — Dashboard, Register, Controls
8. **Audits** — Dashboard, Audits
9. **Committees** — Dashboard, Committees
10. **Risk** — Dashboard (KRIs), Risk Register
11. **Administration** — Settings
12. **AI Assistant** — AI Hub, Prompts, Agents, Knowledge Base, MCP Connectors, Pipelines

### Target Navigation (from `ROUTING_AND_MENU_MAP.md`)
1. Executive
2. Organizations
3. VEG Governance
4. Security Governance
5. **Roadmaps Monitoring** ← separate
6. **Projects Monitoring** ← separate
7. SaaS Governance
8. Compliance
9. Audits
10. Committees
11. AI Hub
12. Administration

### Gaps
| Gap | Severity | Epic |
|-----|----------|------|
| Roadmaps & Projects combined → need split | 🔴 High | EPIC-03 |
| No Projects Monitoring page | 🔴 High | EPIC-07 |
| COMEX Dashboard duplicated (Executive + VEG) | 🟡 Medium | EPIC-01 |
| No dedicated Projects Dashboard | 🔴 High | EPIC-09 |
| No roadmap/project snapshot engine | 🟡 Medium | EPIC-05 |

---

## 6. Technical Debt & Risks

### High Severity
| Issue | Location | Impact |
|-------|----------|--------|
| `blockMockDataPlugin` blocks production builds | `vite.config.ts` | Cannot build for production |
| Dashboard pages are mostly empty shells with mock data | Multiple pages | No real data until backend APIs are called |
| `RoadmapsDashboard` uses mock data | `RoadmapsDashboard.tsx` | Not connected to real APIs |
| `CommitteesDashboard`, `SaaSDashboard`, `RiskDashboard`, `ComplianceDashboard`, `AuditDashboard` — all use mock data | Multiple dashboard pages | Placeholder pages only |
| No projects monitoring page at all | Missing | Users cannot track projects |

### Medium Severity
| Issue | Location | Impact |
|-------|----------|--------|
| VEG components are extremely specialized (16 files) | `components/veg/` | Low reusability across domains |
| Sidebar has 11 groups — may be too many for some roles | `Sidebar.tsx` | Cognitive load |
| Some routes reuse same component for different paths (e.g. `VegGovernanceWorkspace` for 7 routes) | `App.tsx` | Confusing navigation |
| Duplicate COMEX Dashboard in both Executive and VEG sections | `Sidebar.tsx` | Confusion |
| `QueueMonitoringPage` exists without visible sidebar entry | No sidebar link | Orphan page |
| `PipelinesPage` is under AI Assistant but logically separate | `Sidebar.tsx` | Wrong grouping |
| Report Engine is under Security Governance but should be under Reports | `Sidebar.tsx` | Wrong grouping |

### Low Severity
| Issue | Location | Impact |
|-------|----------|--------|
| Migration numbering has gaps (009-012, 019, 023 missing) | `migrations/` | Cosmetic |
| Some down migrations missing for newer migrations (034+) | `migrations/` | Can't roll back cleanly |
| `@ts-expect-error` for Express Layer patch | `app.ts` | Fragile workaround |

---

## 7. Gap Analysis vs AI-GRCP Target Vision

| Domain | Target | Current | Gap | Epic |
|--------|--------|---------|-----|------|
| Executive Dashboards | ✅ | ✅ Full dashboard with KPIs, charts | None | — |
| Organizations | ✅ | ✅ Organizations + Applications | None | — |
| VEG Governance | ✅ | ✅ Full feature set | None | — |
| Security Governance | ✅ | ✅ Dashboard + Vulnerabilities + Nexus | None | — |
| Roadmaps Monitoring | ✅ | ⚠️ Basic page only, no monitoring | Needs monitoring module | EPIC-04 |
| Projects Monitoring | ❌ | ❌ Missing entirely | Needs module + routing | EPIC-07 |
| Snapshot Engine | ❌ | ❌ Missing | Month-over-month comparison | EPIC-05 |
| Roadmap Dashboards | ❌ | ⚠️ Basic dashboard, no RTD/charts | Needs RTD evolution, capacity | EPIC-06 |
| Project Dashboards | ❌ | ❌ Missing | Needs RAG heatmaps, slippage | EPIC-09 |
| Cross-Traceability | ❌ | ❌ Missing | Link findings ↔ projects ↔ roadmaps | EPIC-10 |
| KPI Engine | ❌ | ⚠️ kpi_snapshots table exists | Needs centralization + UI | EPIC-11 |
| Workflow Engine | ❌ | ⚠️ workflow.engine.ts exists (empty?) | Needs completion | EPIC-12 |
| Notification Center | ❌ | ⚠️ notification.engine.ts exists | Needs completion + UI | EPIC-13 |
| AI Hub | ✅ | ✅ Full (copilots, agents, KB, RAG, MCP) | None | EPIC-14→19 |
| Reporting Engine | ✅ | ✅ Report generation, schedules, email | None | EPIC-19 |

---

## 8. Implementation Dependency Map

```
EPIC-03: Split Portfolio Domain
  ├── EPIC-04: Roadmaps Monitoring Module
  │     └── EPIC-06: Roadmap Dashboards
  ├── EPIC-07: Projects Monitoring Module
  │     └── EPIC-09: Project Dashboards
  ├── EPIC-05: Snapshot Engine
  └── EPIC-10: Cross-Traceability
            └── EPIC-08: SteerCo Management

EPIC-01: Navigation Reorganization
  └── Sidebar cleanup (standalone, no deps)

EPIC-02: Design System Delta
  └── Component standardization (standalone, can overlap)

EPIC-11: KPI Engine (depends on EPIC-05 for historical data)
EPIC-12: Workflow Engine (depends on EPIC-11 for triggers)
EPIC-13: Notification Center (depends on EPIC-12)

EPIC-20: Testing & Hardening (can run in parallel)
```

---

## 9. Recommended Execution Order

### Phase A — Quick wins (can run in parallel, no deps)
1. **EPIC-01**: Navigation Reorganization — split sidebar into Roadmaps Monitoring / Projects Monitoring, deduplicate COMEX, regroup pipelines/report engine
2. **EPIC-02**: Design System Delta — standardize dashboard layout, ensure KPI card / RAG badge / filter panel patterns are consistent

### Phase B — Core portfolio split (sequential)
3. **EPIC-03**: Split Portfolio Domain — create domain shells for Roadmaps and Projects
4. **EPIC-04**: Roadmaps Monitoring Module — full CRUD, monitoring views, RTD tracking
5. **EPIC-07**: Projects Monitoring Module — full CRUD, project views, SteerCo data
6. **EPIC-05**: Snapshot Engine — month-over-month comparison for both domains

### Phase C — Dashboards (depends on Phase B)
7. **EPIC-06**: Roadmap Dashboards — RTD evolution, capacity gap, RAG status
8. **EPIC-09**: Project Dashboards — slippage, budget burn, test automation, go-live readiness

### Phase D — Cross-domain (depends on Phase B + C)
9. **EPIC-10**: Cross-Traceability — link unified_findings → projects → roadmaps
10. **EPIC-08**: SteerCo Management — committee dashboard with portfolio context

### Phase E — Foundation (can run parallel to everything)
11. **EPIC-11**: KPI Engine
12. **EPIC-12**: Workflow Engine
13. **EPIC-13**: Notification Center
14. **EPIC-20**: Testing & Hardening

---

## 10. Assessment Summary

**What's already done:**
- Full architecture with Express + React + PostgreSQL + Redis
- Complete authentication and RBAC with 7 user roles
- Executive dashboard with real KPI cards and charts
- Full VEG governance module (16 components, deals, workflow, dashboard)
- Full security governance with Nexus IQ integration (7 detail pages)
- Unified findings store with vulnerability enrichment (EPSS, CISA KEV)
- Complete AI Hub with 8 copilots, 9 agents, KB/RAG, MCP (9 connectors)
- Report engine with scheduling and email distribution
- CI/CD pipeline integration (GitHub/GitLab webhooks)
- Admin panel with users, teams, audit logs
- Chatbot widget with page awareness and SSE streaming
- TypeScript passing with zero errors

**What needs to be built:**
- Roadmaps Monitoring (EPIC-04) — highest value
- Projects Monitoring (EPIC-07) — second highest
- Snapshot Engine (EPIC-05) — enables month-over-month
- Roadmap/Project Dashboards (EPIC-06/EPIC-09) — deep analytics
- Cross-Traceability (EPIC-10) — connects findings to portfolio
- KPI Engine / Workflow / Notifications (EPIC-11/12/13) — foundational
- Navigation cleanup (EPIC-01) — quick fix
- Design system audit (EPIC-02) — stylistic consistency

**Total remaining epics:** 13 (EPIC-01 through EPIC-13 + EPIC-20)
**Already delivered:** 7 (EPIC-14 through EPIC-19 + Bug Bash)
