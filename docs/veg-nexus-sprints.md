# VEG & Nexus IQ — Sprint Plan

## Sprint Structure

Each sprint follows a consistent pattern:
1. **Implement** features per the plan (`veg-nexus-plan.md`)
2. **Write automated tests** for all new code (unit + integration + frontend as applicable)
3. **Run full regression** — all tests from **all previous sprints** must pass before sprint is complete
4. **Zero TypeScript errors** — `tsc --noEmit` must pass on frontend and backend

Test script references:
- Backend: `npm test` (vitest run) from `backend/`
- Frontend: `node node_modules/vitest/vitest.mjs run` from `frontend/`
- Frontend TS: `node node_modules/.bin/tsc --noEmit` from `frontend/`
- E2E: `node node_modules/@playwright/test/cli.js test` from `frontend/`

---

## Sprint 1: Classic VEG Workflow Frontend

**Goal:** Build the missing frontend UI for the existing classic VEG workflow (department sign-offs, bid/go-no-go decisions, opportunities, contracts). Backend + API + hooks already exist.

**Duration:** 5 days

### Backend Work (Day 1)
| Item | Description |
|------|-------------|
| Verify all classic VEG endpoints work via Swagger/curl | Smoke-test `GET /api/veg`, `POST`, `PATCH /:id/signoff/:department`, `PATCH /:id/bid`, `PATCH /:id/gonogo`, `POST /:id/opportunities`, `POST /opportunities/:id/contracts` |
| Add `VegRequestDetailResponse` type to return request + opportunities + contracts in one call (aggregated detail) | Update `veg.service.ts` `getById()` to join opportunities + contracts |

### Frontend Work (Days 2–4)
| Item | Description |
|------|-------------|
| **VEG Requests List** — Tabular list of veg_requests with status badges, type badges, client search, pagination | New file: `VegRequestList.tsx` (or integrated in VegGovernanceWorkspace.tsx as a 5th sub-mode) |
| **VEG Request Create/Edit Form** — Fields: client, title, type (dropdown), description, opportunity link, owner | Form with Zod validation, react state management |
| **VEG Request Detail + Workflow Panel** — Status timeline (DRAFT→SUBMITTED→APPROVED→CONTRACT_SIGNATURE or REJECTED), department sign-off cards (finance/sales/product/legal) with approve/reject buttons | Each department card shows state with color coding |
| **Bid Decision Toggle** — BID / NO_BID radio with confirmation dialog | Integrate with `useBidDecision` hook |
| **Go/No-Go Decision Toggle** — GO / NO_GO radio with reason input | Integrate with `useGoNoGo` hook |
| **Opportunities Table + Create** — Inline table of opportunities under request, create form (name, value, probability, close date) | Integrate with `useCreateOpportunity` hook |
| **Contracts Table + Create** — Inline table of contracts under opportunity, create form (name, value, start/end date, status) | Integrate with `useCreateContract` hook |
| **Sidebar Integration** — Add VEG Workflow nav item alongside existing VEG Deal Register | Update `Sidebar.tsx` |

### Tests (Day 5)
| Item | Description |
|------|-------------|
| Frontend unit tests | Render VEG request list, form submission, sign-off actions, bid/go-nogo toggle (mock API) |
| Frontend TS check | `tsc --noEmit` = zero errors |
| Backend regression | Run all backend tests (ensure veg.functional.test.ts + veg.service.test.ts + veg.integration.test.ts pass) |
| Full test run | `npm test` in backend/ + `vitest run` in frontend/ |

### Exit Criteria
- Classic VEG workflow fully usable from frontend (create → submit → sign-off → bid → go-nogo → opportunity → contract)
- All 190+ existing tests pass + new sprint tests pass
- Zero TS errors in frontend

---

## Sprint 2: VEG Deal Enhancement + VEG Notifications

**Goal:** Improve the VEG Deal Register with export, advanced charts, and Executive Dashboard KPIs. Add VEG event bus and SLA tracking.

**Duration:** 5 days

### Backend Work (Days 1–2)
| Item | Files |
|------|-------|
| **VEG Deal Export Endpoint** — `GET /api/veg-deals/export?format=csv` with same filters as list, streams CSV | `veg-deal.routes.ts`, `veg-deal.service.ts` |
| **VEG Event Bus** — Emit events on: request created/submitted/signed-off/approved/rejected, bid decision, go/nogo decision, deal created/updated | New file: `veg-events.service.ts` (EventEmitter pattern) |
| **VEG SLA Detection** — Add `due_date` to veg_requests (migration 024), BullMQ worker `veg-sla-check` for daily overdue detection | Migration, `queue.service.ts` update, `veg.service.ts` SLA check |
| **VEG Deal Stats Endpoint Enhancement** — Add year-over-year comparison, monthly TCV trend data | `veg-deal.service.ts` `getStats()` |
| **Executive Dashboard VEG KPI Endpoint** — `GET /api/dashboard/veg-kpis` — total deals, total TCV, won count, avg deal size, won rate | `dashboard.routes.ts`, `kpi.service.ts` |

### Frontend Work (Days 3–4)
| Item | Description |
|------|-------------|
| **CSV Export Button** — Filter-aware export on VEG Deal list page | `VegGovernanceWorkspace.tsx` |
| **Advanced Charts** — TCV trend line chart (Recharts), decision distribution pie, regional heatmap, year-over-year comparison bar chart | `VegGovernanceWorkspace.tsx` Dashboard mode using Recharts |
| **Executive Dashboard VEG KPIs** — Add VEG Deal KPI card row to Exec Dashboard | `ExecutiveDashboard.tsx` |
| **VEG SLA Warning** — Show overdue/due-soon indicators on VEG request items | `VegRequestDetail.tsx` |

### Tests (Day 5)
| Item | Description |
|------|-------------|
| `veg-deal.repo.ts` unit test | Test getAggregates, getDecisionsOverview, getBusinessLinesOverview, getRegionOverview with mock pool |
| Export endpoint test | Verify CSV output format and content |
| VEG event bus test | Verify events emitted on key actions |
| Frontend advanced chart test | Verify chart components render with mock data |
| Executive Dashboard VEG KPI test | Verify KPI cards display correct values |
| Full regression | All 190+ tests + Sprint 1 tests |

### Exit Criteria
- VEG deals exportable as CSV with current filters
- Dashboard shows VEG KPIs
- All charts render with real data
- VEG SLA deadlines tracked with daily worker
- All tests pass

---

## Sprint 3: Nexus Policy Violations + Compliance Classification

**Goal:** Build the missing policy violations backend + frontend. Add compliance classification framework for regulatory mapping.

**Duration:** 5 days

### Backend Work (Days 1–3)
| Item | Files |
|------|-------|
| **Policy Rules Repo** — CRUD for `policy_rules` table | `backend/src/repositories/policyRules.repo.ts` |
| **Policy Rules Service** — CRUD + `listByThreatLevel()`, `listByCategory()` | `backend/src/services/policyRules.service.ts` |
| **Policy Rules Routes** — `GET /api/policy-rules`, `POST`, `PATCH /:id`, `DELETE /:id` | `backend/src/routes/policyRules.routes.ts` |
| **Policy Violations Endpoint** — `GET /api/applications/:id/policy-violations` — aggregated violations per scan report | `nexus.routes.ts` or new file |
| **Migration 023: Compliance Classification** — `compliance_classification` table (id, finding_id, framework, control_id, requirement, impact_assessment, created_at), `regulatory_mapping` table (id, severity, framework, control_id, sla_days) | `backend/migrations/023_compliance_classification.sql` + `_down.sql` |
| **Compliance Service** — `autoClassify(findingId)`, `getFrameworkSummary(framework)`, `getSLAStatus(findingId)`, `detectBreaches()` | `backend/src/services/compliance.service.ts` |
| **Compliance Routes** — `GET /api/compliance/frameworks`, `GET /api/compliance/findings/:id`, `GET /api/compliance/sla-breaches` | `backend/src/routes/compliance.routes.ts` |
| **Register compliance routes in app.ts** | `backend/src/app.ts` |

### Frontend Work (Days 3–4)
| Item | Description |
|------|-------------|
| **Policy Rules Management Page** — Table of all policy rules with create/edit/delete, filter by threat level and category | New page or integrated in existing |
| **Policy Violations Tab in Nexus Report Detail** — Show violation count, threat level breakdown, link to violations detail | `NexusReportDetail.tsx` |
| **Compliance Matrix Page** — Grid view: rows = frameworks (PCI-DSS, GDPR, SOX), columns = severity levels, cells = finding counts with color coding | New file: `ComplianceWorkspace.tsx` |
| **Per-finding Compliance Badges** — Show applicable frameworks + SLA status on vulnerability detail | `NexusVulnerabilityDetail.tsx` |
| **Compliance SLA Breach Alerts** — List of overdue SLA items with severity, framework, days overdue | Compliance page sub-section |

### Tests (Day 5)
| Item | Description |
|------|-------------|
| `policyRules.repo.test.ts` | Unit tests for CRUD (mocked pool) |
| `policyRules.service.test.ts` | Unit tests for business logic |
| `compliance.service.test.ts` | Unit tests for auto-classify, SLA breach detection |
| `compliance.integration.test.ts` | Integration test with real DB |
| Frontend policy page test | Render + CRUD operations with mocked API |
| Frontend compliance matrix test | Render grid with mock framework data |
| Full regression | All 190+ tests + Sprint 1–2 tests |

### Exit Criteria
- Policy rules CRUD fully functional with frontend
- Compliance classification applied to findings on sync
- Compliance matrix shows framework coverage
- SLA breaches detected and displayed
- All tests pass

---

## Sprint 4: Multi-Scanner Adapters

**Goal:** Extend unified findings beyond Nexus IQ. Add Fortify SSC adapter, SonarQube webhook handler, and Veracode adapter.

**Duration:** 5 days

### Backend Work (Days 1–4)
| Item | Files |
|------|-------|
| **ScannerHttpClient Base Class** — Shared HTTP client with: retry with exponential backoff, configurable rate limiting, connection pooling, token masking in logs, `testConnection()` method, timeout handling | `backend/src/services/scannerHttpClient.ts` |
| **Fortify SSC HTTP Client** — REST API client for Fortify Software Security Center: project listing, artifact versions, vulnerability retrieval, pagination for 10K+ issues | `backend/src/services/fortifyHttpClient.ts` (extends or uses ScannerHttpClient) |
| **Fortify Adapter** — Map Fortify priority (1–5) → unified severity (CRITICAL/HIGH/MEDIUM/LOW), extract CWE, file path, line number, foldername, flag PII-related findings | `backend/src/services/fortifyAdapter.ts` |
| **Fortify Sync Service** — BullMQ worker `fortify-sync`, poll every 6 hours, batch upsert findings via `unifiedFindingRepo.bulkUpsertFindings()`, update scan_reports | `backend/src/services/fortifySyncService.ts` |
| **Fortify Routes** — `GET /api/fortify/sync/status`, `POST /api/fortify/sync/trigger` | `backend/src/routes/fortify.routes.ts` |
| **SonarQube Webhook Route** — `POST /api/sonarqube/webhook` with secret validation, extract quality gate status and security hotspots | `backend/src/routes/sonarqube.routes.ts` |
| **SonarQube Adapter** — Map BLOCKER/CRITICAL/MAJOR/MINOR/INFO → severity, extract rule ID, file path, message, flag GDPR-relevant rules (S5332, S2068) | `backend/src/services/sonarqubeAdapter.ts` |
| **SonarQube Poll Service** — Optional BullMQ worker `sonarqube-poll`, GET /api/hotspots/search every 6h, batch upsert | `backend/src/services/sonarqubePollService.ts` |
| **Veracode HTTP Client** — REST API with HMAC authentication, GET /api/auth/auth/v1/codestream/{appGuid}/findings, pagination | `backend/src/services/veracodeHttpClient.ts` |
| **Veracode Adapter** — Map Veracode severities (VERY_HIGH, HIGH, MEDIUM, LOW, VERY_LOW) → unified, add VERY_HIGH to source_severity enum | `backend/src/services/veracodeAdapter.ts` |
| **Veracode Sync Service** — BullMQ worker `veracode-sync`, poll configurable interval, batch upsert | `backend/src/services/veracodeSyncService.ts` |
| **Veracode Routes** — `GET /api/veracode/sync/status`, `POST /api/veracode/sync/trigger` | `backend/src/routes/veracode.routes.ts` |
| **Register all new routes in app.ts** | `backend/src/app.ts` |
| **Migration 024: Add source tools** — Add `FORTIFY`, `SONARQUBE`, `VERACODE` to `finding_source` enum | `backend/migrations/024_multi_scanner.sql` |

### Tests (Day 5)
| Item | Description |
|------|-------------|
| `scannerHttpClient.test.ts` | Unit tests for base client (retry, timeout, rate limit) |
| `fortifyAdapter.test.ts` | Unit tests for priority→severity mapping |
| `sonarqubeAdapter.test.ts` | Unit tests for severity mapping + GDPR detection |
| `veracodeAdapter.test.ts` | Unit tests for severity mapping |
| `fortifySyncService.test.ts` | Mocked HTTP tests |
| `sonarqube.routes.integration.test.ts` | Webhook payload integration test |
| Migration 024 test | Verify enum values added correctly |
| Full regression | All 190+ tests + Sprint 1–3 tests |

### Exit Criteria
- Fortify sync can connect, ingest, and store findings in unified_findings
- SonarQube webhook accepts payloads and creates findings
- Veracode sync functional with HMAC auth
- All 3 new source_tool values queryable in unified_findings
- Cross-tool summary shows findings from all sources
- All tests pass

---

## Sprint 5: Scale Hardening + Frontend Integration & E2E

**Goal:** Production-scale the database for 100K+ findings. Convert Nexus drill-down from flat state to URL routing. Add comprehensive E2E tests.

**Duration:** 5 days

### Backend Work (Days 1–2)
| Item | Files |
|------|-------|
| **Migration 025: Partition unified_findings** — Convert `unified_findings` to partitioned table by month (created_at), create default partition, migrate existing data, update FK references | `backend/migrations/025_partition_unified_findings.sql` + `_down.sql` |
| **Partition Maintenance Cron** — BullMQ worker `partition-maintenance` on monthly cron to create next month's partition, detach old months | `backend/src/services/partition.service.ts`, `queue.service.ts` update |
| **Archive Service** — `archive.service.ts`: move findings >12 months to `findings_archive` table, maintain queryable view across archive | `backend/src/services/archive.service.ts` |
| **Archive Routes** — `POST /api/admin/archive/trigger`, `GET /api/admin/archive/status` | `backend/src/routes/admin.routes.ts` (enhance) |
| **Database Performance** — Add missing indexes based on query analysis, tune connection pool settings | `backend/migrations/026_performance_indexes.sql` |
| Update `scan_report.repo.ts` and `scanReport.service.ts` to handle partition routing | Scan report queries |

### Frontend Work (Days 2–4)
| Item | Description |
|------|-------------|
| **URL Routing for Nexus** — Convert Nexus drill-down from flat `useState` to React Router nested routes: `/nexus/`, `/nexus/app/:appId`, `/nexus/report/:reportId`, `/nexus/vuln/:vulnId`, `/nexus/occurrence/:occId` | Update `App.tsx`, all Nexus page components |
| **URL Routing for VEG** — `/veg/` (dashboard), `/veg/list` (deal list), `/veg/deal/:id` (deal detail), `/veg/workflow` (classic workflow) | Update `App.tsx`, `VegGovernanceWorkspace.tsx` |
| **Sidebar Submenu** — Nexus IQ: Overview, Applications, Reports, Vulnerabilities; VEG: Deal Register, Workflow Requests | `Sidebar.tsx` |
| **Browser History Support** — Back/forward navigation works for drill-down chain | React Router `useNavigate`/`useParams` |
| **Deep Link Support** — Direct URL access to any page (e.g., `/nexus/vuln/some-uuid`) | Route parameter parsing |

### E2E Tests (Day 4–5)
| Item | Description |
|------|-------------|
| `nexus-drilldown.e2e.spec.ts` — Full drill-down chain: Overview → App → Report → Vuln → Occurrence, verify correct data at each level, back/forward navigation | Playwright |
| `veg-deal-register.e2e.spec.ts` — Deal list: filter, paginate, view detail, navigate back | Playwright |
| `veg-workflow.e2e.spec.ts` — Create VEG request → submit → sign-off (all 4 departments) → bid decision → go/nogo → create opportunity → create contract | Playwright |
| `login.e2e.spec.ts` — Enhance existing login test: multi-role login, RBAC-sensitive navigation | Playwright |
| `compliance.e2e.spec.ts` — Compliance matrix page: framework filtering, finding drill-down | Playwright |
| E2E CI setup — GitHub Actions workflow for Playwright with PostgreSQL service container | `.github/workflows/e2e.yml` |

### Tests (Day 5)
| Item | Description |
|------|-------------|
| `partition.service.test.ts` | Unit tests for partition creation, management |
| `archive.service.test.ts` | Unit tests for archive/restore logic |
| Archive integration test | Verify data moves correctly between partitions |
| Performance benchmark test | Query timing before/after indexing |
| Frontend routing test | Verify URL params map to correct views |
| Full regression | All 190+ tests + Sprint 1–4 tests |

### Exit Criteria
- `unified_findings` partitioned by month
- Archive service moves old data correctly
- Nexus drill-down navigates via URL with browser back/forward support
- Sidebar shows submenus for Nexus IQ and VEG
- 5 E2E test suites passing in Playwright
- All tests pass

---

## Sprint 6: Notifications + UX Polish + CI/CD

**Goal:** Wire real notifications (Slack/email), add monitoring and alerting UIs, polish UX across all pages, set up CI/CD pipeline.

**Duration:** 5 days

### Backend Work (Days 1–3)
| Item | Files |
|------|-------|
| **Email Transport** — Wire `email-notify` BullMQ queue to Nodemailer (SMTP config from env), HTML email templates for: critical finding alert, SLA breach, waiver expiry, VEG approval required | `backend/src/services/email.service.ts` |
| **Slack Webhook Integration** — POST to Slack webhook URL for critical alerts (EPSS > 0.9 + CISA KEV), mitigation overdue, VEG request submitted | `backend/src/services/slack.service.ts` |
| **Alert Rules Engine** — `alert_rules` table (migration 026), CRUD service/routes, evaluate rules on finding sync/update, auto-create `nexus_alerts` | `backend/migrations/026_alert_rules.sql`, `backend/src/services/alertEngine.service.ts`, `backend/src/routes/alert.routes.ts` |
| **Notification Router** — Route notifications through appropriate channel based on rule config (email/slack/both), delivery status tracking | `backend/src/services/notification.service.ts` |
| **BullMQ Monitoring API** — `GET /api/admin/queues` with counts per queue, `POST /api/admin/queues/:name/retry-all`, `POST /api/admin/queues/:name/clean` | `backend/src/routes/admin.routes.ts` |

### Frontend Work (Days 3–4)
| Item | Description |
|------|-------------|
| **BullMQ Monitoring Page** — Queue status dashboard: waiting/active/completed/failed counts per queue, retry buttons, job list with error details, historical chart | New file: `BullMQMonitor.tsx` |
| **Nexus Sync Scheduling UI** — Configure sync interval, manual trigger button, sync log viewer with status badges, last sync timestamp | New section in Nexus Overview or Settings |
| **Alert Rules Management** — Create/edit/delete alert rules, test rule button, rule enable/disable toggle | New file or integrated in Admin page |
| **react-hook-form + Zod Migration** — Migrate forms: mitigation proposal, waiver create, VEG request create/edit, VEG deal create/edit to react-hook-form with inline Zod validation | All affected pages |
| **Advanced Pagination** — Page number selector, page size selector (10/25/50/100), total count display, "Go to page" input | Component: `Pagination.tsx` |
| **Bulk Operations** — Checkbox selection on tables, bulk action toolbar: batch assign owner, batch change status (vulnerabilities/veg deals), confirm dialog | `NexusVulnerabilityDetail.tsx`, `VegGovernanceWorkspace.tsx` |
| **Dark Mode** — CSS custom properties for theming, theme toggle in sidebar header, localStorage persistence, respects `prefers-color-scheme` | Global CSS, theme context/provider |

### CI/CD Pipeline (Day 4–5)
| Item | Files |
|------|-------|
| **GitHub Actions: Unit Tests** — Backend + frontend vitest on push/PR | `.github/workflows/test.yml` |
| **GitHub Actions: Integration Tests** — With PostgreSQL service container, health check, migration run | `.github/workflows/integration.yml` |
| **GitHub Actions: Lint + TypeScript Check** — ESLint + tsc --noEmit for both backend and frontend | `.github/workflows/quality.yml` |
| **GitHub Actions: E2E** — Playwright with backend + frontend servers, all E2E specs | `.github/workflows/e2e.yml` |
| **GitHub Actions: Docker Build** — Build + push backend and frontend images on merge to main | `.github/workflows/docker-build.yml` |

### Tests (Day 5)
| Item | Description |
|------|-------------|
| `email.service.test.ts` | Unit tests for email transport (mocked) |
| `slack.service.test.ts` | Unit tests for Slack webhook (mocked) |
| `alertEngine.service.test.ts` | Unit tests for rule evaluation logic |
| `notification.service.test.ts` | Unit tests for channel routing |
| `monitoring.routes.test.ts` | Integration test for queue status endpoints |
| Frontend monitoring page test | Render queue list, retry action |
| Frontend react-hook-form test | Form validation, submission with mocked API |
| Dark mode test | Toggle, localStorage persistence, CSS class application |
| CI/CD workflow validation | Dry-run GitHub Actions locally (act) if possible |
| Full regression | **ALL tests from Sprint 1–5** + new tests |

### Exit Criteria
- Email notifications sent for critical findings and SLA breaches
- Slack webhook fires for high-severity alerts
- Alert rules engine evaluates and creates alerts automatically
- BullMQ monitoring page shows real-time queue statuses
- All forms use react-hook-form + Zod
- All tables have advanced pagination
- Bulk operations work on findings and deals
- Dark mode toggleable with persistence
- CI/CD pipeline runs tests on push/PR
- **All tests pass across all 6 sprints**

---

## Sprint Dependency Graph

```
Sprint 1 (VEG Workflow FE)
    ↓
Sprint 2 (VEG Enhancements + Notifications)
    ↓
Sprint 3 (Policy Violations + Compliance)
    ↓
Sprint 4 (Multi-Scanner Adapters)
    ↓
Sprint 5 (Scale Hardening + Routing + E2E)
    ↓
Sprint 6 (Notifications + UX + CI/CD)
```

Each sprint includes a **full regression run** of all tests from all prior sprints, ensuring no regressions are introduced.

---

## Test Inventory (Cumulative Per Sprint)

| Sprint | New Tests | Cumulative Test Count |
|--------|-----------|----------------------|
| Pre-existing | — | ~192 |
| Sprint 1 | ~8 (frontend) | ~200 |
| Sprint 2 | ~6 (3 backend + 3 frontend) | ~206 |
| Sprint 3 | ~8 (4 backend + 4 frontend) | ~214 |
| Sprint 4 | ~10 (all backend) | ~224 |
| Sprint 5 | ~8 (3 backend + 5 E2E) | ~232 |
| Sprint 6 | ~12 (6 backend + 4 frontend + 2 CI) | ~244 |

All ~244 tests must pass at Sprint 6 completion.

---

## Key Technical Decisions

1. **Classic VEG Workflow Frontend** — Add a 5th sub-mode (`"workflow"`) to existing `VegGovernanceWorkspace.tsx` rather than creating a separate page, keeping all VEG in one workspace
2. **react-hook-form Migration** — Do gradually across Sprint 6, one form type at a time, verifying no regressions after each migration
3. **URL Routing** — Keep flat `currentView` + `useState` drill-down pattern for existing pages. Only convert Nexus and VEG to URL routing. Other pages remain state-based.
4. **Archive Strategy** — Soft-delete in unified_findings, move to findings_archive table, keep archive queryable via `UNION ALL` view
5. **CI/CD** — Start with GitHub Actions. If self-hosted runner needed for E2E, use the existing Docker Compose setup as the test environment.
