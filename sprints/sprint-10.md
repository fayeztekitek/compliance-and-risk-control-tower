# Sprint 10: VEG Deal Enhancement + VEG Notifications

**Status:** 📋 Planned  
**Branch:** `sprint-10-veg-enhancements`  
**Goal:** Improve VEG Deal Register with CSV export, advanced charts, and Executive Dashboard KPIs. Add VEG event bus, SLA tracking, and deadline management.

---

## Tasks

### Backend — VEG Deal Export
- [ ] `GET /api/veg-deals/export?format=csv` endpoint with same filters as list
- [ ] Stream CSV with all 38 columns
- [ ] Filename includes date and filter context

### Backend — VEG Event Bus
- [ ] Create `veg-events.service.ts` (EventEmitter pattern)
- [ ] Emit events on: request created/submitted/signed-off/approved/rejected
- [ ] Emit events on: bid decision, go/nogo decision
- [ ] Emit events on: deal created/updated

### Backend — VEG SLA Tracking
- [ ] Migration 024: add `due_date` to `veg_requests` table
- [ ] BullMQ worker `veg-sla-check` for daily overdue detection
- [ ] SLA breach notification event

### Backend — VEG Deal Enhanced Stats
- [ ] Year-over-year comparison data in `getStats()`
- [ ] Monthly TCV trend data endpoint

### Backend — Executive Dashboard VEG KPIs
- [ ] `GET /api/dashboard/veg-kpis` — total deals, total TCV, won count, avg deal size, won rate

### Frontend — VEG Deal Export
- [ ] Export button on VEG Deal list (filter-aware)
- [ ] Download progress indicator

### Frontend — Advanced Charts (Dashboard Mode)
- [ ] TCV trend line chart (Recharts)
- [ ] Decision distribution pie chart
- [ ] Regional heatmap
- [ ] Year-over-year comparison bar chart

### Frontend — Executive Dashboard VEG KPIs
- [ ] Add VEG Deal KPI card row to ExecutiveDashboard

### Frontend — VEG SLA Warning
- [ ] Overdue/due-soon indicators on VEG request detail

---

## Deliverables

- [ ] VEG deals exportable as CSV with current filters
- [ ] Dashboard shows VEG KPIs (total deals, TCV, won/lost/open)
- [ ] 4 interactive charts in VEG Deal Dashboard
- [ ] VEG SLA deadlines tracked with daily BullMQ worker
- [ ] Events emitted for all key VEG actions

---

## Tests

| Type | Count | Description |
|------|-------|-------------|
| Backend Unit | 3 | `veg-deal.repo.ts` aggregate methods, event bus, SLA check |
| Backend Integration | 1 | Export endpoint |
| Frontend Unit | 3 | Chart components, export button, VEG KPI cards |
| Regression | ~200 | All Sprint 1–9 tests |

---

## Branch Strategy

```
git checkout -b sprint-10-veg-enhancements
# ... develop ...
git checkout main
git merge sprint-10-veg-enhancements
```
