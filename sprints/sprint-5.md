# Sprint 5: Nexus IQ & Background Jobs

**Duration:** 2 weeks
**Goal:** Sonatype Nexus IQ integration with policy evaluation, vulnerability sync, and BullMQ background job infrastructure.

---

## Tasks

### Backend — BullMQ Infrastructure
- [ ] Install & configure BullMQ with Redis connection
- [ ] Queue definitions: `nexus-sync`, `kpi-recalc`, `sla-breach`, `waiver-expiry`, `email-notify`
- [ ] Worker base class + individual workers
- [ ] Job scheduler (repeatable cron jobs)
- [ ] Job dashboard API: `GET /api/jobs` — status, retry, logs

### Backend — Nexus IQ Service
- [ ] `NexusHttpClient` — raw HTTP calls with exponential backoff retry
- [ ] `NexusDataMapper` — transforms API responses → domain models
- [ ] `NexusSyncService` — orchestrates full sync lifecycle
- [ ] `NexusSyncOrchestrator` — BullMQ job for scheduled + manual syncs
- [ ] Mock mode toggle: `USE_MOCK_DATA` env var switches between mock seeds and live data
- [ ] Connection config stored in database (`nexus_config` table)

### Backend — Risk Score Engine
- [ ] `RiskScoreService.calculate()` — 8-factor weighted formula
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

### Backend — Background Job Workers
- [ ] `nexus-sync` worker — full Nexus IQ data sync
- [ ] `sla-breach` worker — detect overdue vulnerabilities, create SLA incidents
- [ ] `waiver-expiry` worker — auto-expire waivers past expiry_date
- [ ] `email-notify` worker — send notifications (placeholder)

### Frontend — Nexus IQ Workspace
- [ ] Connection settings panel (URL, credentials, test button)
- [ ] Sync trigger button with real-time progress bar
- [ ] Product explorer with drill-down
- [ ] Vulnerability explorer (searchable/filterable CVE list)
- [ ] Waiver management UI
- [ ] Risk score display per product
- [ ] Job dashboard (status, retry, history)

### Mock Data Compatibility
- [ ] When `USE_MOCK_DATA=true`: seed tables from `nexusMockData.ts`
- [ ] When `USE_MOCK_DATA=false`: data from real Nexus IQ sync
- [ ] Service layer identical in both modes

---

## Deliverables

- [ ] BullMQ queue infrastructure with 5 workers
- [ ] Nexus IQ sync (mock + real modes)
- [ ] 8-factor risk score engine
- [ ] Connection configuration UI
- [ ] Sync progress + job dashboard
- [ ] Scheduled SLA breach + waiver expiry checks

---

## Tests

| Type | Count | Description |
|------|-------|-------------|
| Unit | 8 | HTTP retry, data mapper, risk score boundaries, job scheduling, mock/real toggle |
| Integration | 6 | Config CRUD, sync status, product endpoint, waiver, job lifecycle, SLA breach detection |
| Functional | 2 | Configure → test → sync → view dashboard; waiver create → auto-expire |
