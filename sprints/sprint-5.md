# Sprint 5: Executive Dashboard & KPI Engine

**Duration:** 2 weeks
**Goal:** Production dashboard with real-time data, 5×5 heatmap, chart widgets, export.

---

## Tasks

### Backend — Dashboard Endpoints
- [ ] `GET /api/dashboard/executive` — consolidated payload (KPIs, KRIs, heatmap, trends)
- [ ] `GET /api/dashboard/kpi` — 16 real-time KPI calculations (from KPIEngineService)
- [ ] `GET /api/dashboard/kri` — 4 KRI thresholds with status
- [ ] `GET /api/dashboard/heatmap` — 5×5 risk matrix coordinate data
- [ ] `GET /api/dashboard/trends` — historical KPI snapshots (monthly aggregation)
- [ ] `GET /api/export/csv` — CSV export of any filtered dataset
- [ ] `GET /api/export/pdf` — audit report generation

### Backend — Background Jobs (BullMQ)
- [ ] KPI recalculation job — runs every 15 minutes, cached in Redis
- [ ] Historical KPI archive job — daily snapshot to `kpi_snapshots` table
- [ ] Dashboard cache invalidation on data mutation

### Frontend — Dashboard Components
- [ ] Replace localStorage dashboard data with TanStack Query (auto-refresh 60s)
- [ ] KPI card grid (16 cards with status colors, trend arrows, target indicators)
- [ ] 5×5 heatmap with cell drill-down (migrate existing logic to hook)
- [ ] Scanner suite bar chart (Veracode / Nexpose / PenTest breakdown)
- [ ] Chronos RTD area chart (project slippage over time)
- [ ] KRI financial breach limits panel (breach cost, SLA exceeded, budget, non-compliant SaaS)
- [ ] "Yesterday's Pending Items" panel (migrate existing to data-driven)
- [ ] Critical Exposures Registry — top 5 critical/high vulnerabilities
- [ ] Upcoming Committees widget
- [ ] Export buttons (CSV, PDF) with loading state
- [ ] Role-based KPI visibility (some KPIs hidden from EXECUTIVE_READ_ONLY)

### Chart Configuration (Recharts)
- [ ] Bar chart: vulnerabilities by scanner + severity stack
- [ ] Area chart: RTD trends by month
- [ ] Pie/Radar chart: KPI category distribution
- [ ] Heatmap: 5×5 grid with color intensity based on count

---

## Deliverables

- [ ] Dashboard loads all KPIs within 500ms
- [ ] 5×5 heatmap interactive with cell drill-down
- [ ] Historical trends viewable by month
- [ ] CSV and PDF export working
- [ ] Background KPI recalculation running

---

## Tests

| Type | Count | Description |
|------|-------|-------------|
| Unit | 6 | KPI engine exact match, KRI thresholds, heatmap coordinates, trend MoM calc, cache hit vs miss, CSV formatter |
| Integration | 5 | Executive endpoint, CSV content type, PDF generation, cached vs uncached speed, trend data format |
| Functional | 3 | Dashboard → drill heatmap → export CSV; KPI refresh cycle |
| Performance | 2 | Dashboard under 500ms with 1000 vulns, export under 2s |
