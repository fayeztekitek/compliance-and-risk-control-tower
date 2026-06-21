# Sprint 6: Nexus IQ Connector

**Duration:** 2 weeks
**Goal:** Production-ready Sonatype Nexus IQ integration with real sync.

---

## Tasks

### Backend — Refactored Nexus Architecture
- [ ] `NexusHttpClient` — raw HTTP calls with exponential backoff retry
- [ ] `NexusDataMapper` — transforms API responses → domain models
- [ ] `NexusSyncService` — orchestrates full sync lifecycle
- [ ] `NexusSyncOrchestrator` — BullMQ job for scheduled + manual syncs
- [ ] Mock mode toggle: `USE_MOCK_DATA` env var switches between mock seeds and live data
- [ ] Connection config stored in database (`nexus_config` table) — not hardcoded

### Backend — Risk Score Engine
- [ ] `RiskScoreService.calculate()` — 8-factor weighted formula (migrate from `server.ts`)
- [ ] `RiskScoreService.getProductGrade()` — GREEN/ORANGE/RED threshold logic
- [ ] `RiskScoreService.getAggregates()` — per-product KPI calculations

### Backend — API Routes
- [ ] `GET/PUT /api/nexus/config` — connection settings CRUD
- [ ] `POST /api/nexus/config/test` — test connection probe
- [ ] `POST /api/nexus/sync` — trigger sync (BullMQ job)
- [ ] `GET /api/nexus/sync/status` — real job progress via Redis
- [ ] `GET /api/nexus/sync/logs` — paginated sync history from DB
- [ ] `GET /api/nexus/products` — from database or mock
- [ ] `GET /api/nexus/applications` — list with product mapping
- [ ] `GET /api/nexus/vulnerabilities` — paginated, filterable
- [ ] `GET /api/nexus/kpis/executive` — real KPI snapshot
- [ ] `GET /api/nexus/kpis/product/:id` — per-product KPIs
- [ ] `GET /api/nexus/risk-score/product/:id` — 8-factor risk score
- [ ] `GET /api/nexus/waivers` — list waivers
- [ ] `POST /api/nexus/waivers` — create waiver

### Frontend — Nexus Workspace
- [ ] Replace `NexusApiClient` calls with TanStack Query hooks
- [ ] Executive KPI dashboard: global risk score, vulnerability breakdown, product heatmap
- [ ] Product drill-down: per-product risk score, severity counts, security debt, compliance %, MTTR
- [ ] Vulnerability explorer: searchable/filterable CVE list with severity, reachability, fix availability
- [ ] Waiver management UI: create, view, filter
- [ ] Connection settings panel: URL, username, token, timeout, retry configuration
- [ ] Connection probe button with success/failure indicator
- [ ] Sync trigger button with real-time progress bar (poll `/api/nexus/sync/status`)
- [ ] CSV and PDF export

### Mock Data Compatibility
- [ ] When `USE_MOCK_DATA=true`: seed tables populated from `nexusMockData.ts`
- [ ] When `USE_MOCK_DATA=false`: data comes from real Nexus IQ sync
- [ ] Service layer behavior identical in both modes

---

## Deliverables

- [ ] Nexus IQ configuration saved in database (not hardcoded)
- [ ] Sync runs as background job with real-time progress
- [ ] 8-factor risk score engine matches existing formula
- [ ] Product drill-down shows accurate risk data
- [ ] Export works from both mock and real data paths

---

## Tests

| Type | Count | Description |
|------|-------|-------------|
| Unit | 6 | Retry logic, data mapper, risk score (boundary cases), token masking, mock/real toggle, product grade |
| Integration | 5 | Config CRUD, sync job status, product endpoint, waiver creation, export format |
| Functional | 3 | Configure → test → sync → view dashboard → export; bulk sync 5000 vulns |
| Performance | 2 | Sync handles 5000+ vulnerabilities, risk score API under 200ms |
