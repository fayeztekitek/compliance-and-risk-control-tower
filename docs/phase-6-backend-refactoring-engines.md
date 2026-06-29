# Phase 6: Backend Refactoring — 4 Engines + Event Bus

## Goal
Build the backend engine infrastructure as defined in Phase 2 Architecture: Domain Event Bus, Workflow Engine, Notification Engine, Reporting Engine, and KPI Engine.

## Deliverables

### 1. Database Migration (032)
`backend/migrations/032_phase6_engines.sql`

| Table | Purpose |
|---|---|
| `event_store` | Persistent domain event log (event_type, aggregate, data, metadata) |
| `workflow_definitions` | Configurable state machines (states JSONB, transitions JSONB, entity_type) |
| `workflow_instances` | Active/completed workflow runs with context (current_state, status, context) |
| `workflow_actions` | Audit trail of every state transition (action, from_state, to_state, actor) |
| `notification_rules` | Event-triggered notification rules (event_type, channels, templates, conditions) |
| `notifications` | Delivered/pending notification records (channel, recipient, status) |
| `report_templates` | Report generation templates (config JSONB for sections/queries) |
| `report_instances` | Generated report tracking (format, status, file_path) |
| `kpi_definitions` | KPI metadata catalog (category, unit, formula, refresh_interval) |
| `kri_definitions` | KRI metadata catalog (threshold, severity) |

### 2. Domain Event Bus
`backend/src/core/events/`

| File | Purpose |
|---|---|
| `types.ts` | `DomainEvent` interface, `EventHandler` type |
| `eventBus.ts` | Singleton EventEmitter-based bus with typed publish/subscribe/unsubscribe, wildcard `"*"` support, async handler execution |
| `eventStore.ts` | Persistence layer — `storeEvent()`, `getEventsByAggregate()`, `getEventsByType()` |

### 3. Workflow Engine
`backend/src/services/engines/workflow.engine.ts`

- `createDefinition(states, transitions)` — create a state machine with typed states (initial/intermediate/final)
- `startInstance(definitionName, entityType, entityId, context)` — start a workflow, auto-selects initial state
- `transition(instanceId, action, actorId, comment)` — validate + execute state transition, records action history, publishes `workflow.transition.*` event
- `getInstanceHistory(instanceId)` — full action audit trail with actor names
- `getActiveInstances(entityType?)` — list active workflows, optionally filtered by domain

### 4. Notification Engine
`backend/src/services/engines/notification.engine.ts`

- `initialize()` — subscribes to event bus wildcard, auto-evaluates all rules on every event
- Rule evaluation matches `event_type` + optional `conditions` JSONB
- Dispatches via `emailService.sendAlert()` (Nodemailer) and `slackService.sendAlert()` (webhook)
- Persists every notification to `notifications` table with delivery status
- Template rendering with `{{variable}}` syntax
- `addRule()` — programmatic rule creation
- `getNotifications()` / `markAsRead()` — in-app notification API
- Initialized on server startup in `index.ts`

### 5. Reporting Engine
`backend/src/services/engines/reporting.engine.ts`

- `createTemplate(name, config)` — define report structure with sections (kpi_summary, table with dynamic SQL, chart_data)
- `generateReport(templateId, name, format)` — generates HTML or CSV reports
  - HTML: styled document with dynamic SQL table sections (auto-headers, auto-rows)
  - CSV: arbitrary SQL query → CSV conversion
  - Supports future PDF/XLSX via `xlsx` package (already in dependencies)
- `getReportStatus()` / `listReports()` — track generation results
- Publishes `report.generated` event on completion

### 6. KPI Engine
`backend/src/services/engines/kpi.engine.ts`

- Domain-specific calculators: `calculateSecurityKpis()`, `calculateComplianceKpis()`, `calculateRiskKpis()`, `calculateGovernanceKpis()`, `calculateVegKpis()`, `calculateSaaSKpis()`, `calculateAuditKpis()`
- `calculateAndStore()` — runs all 7 calculators, stores snapshot in `nexus_kpi_snapshots`, publishes `kpi.snapshot.stored` event
- `triggerRecalculation()` — publishes `kpi.recalculate.requested` event + runs calculation
- `getKpiDefinitions()` / `getKriDefinitions()` — reads from new metadata tables
- Replaces the old `kpi.service.ts` `recalculate()` call in the `kpi-recalc` BullMQ worker

### 7. New Queues & Workers

| Queue | Worker | Schedule |
|---|---|---|
| `notification-dispatch` | `queue.service.ts` worker | Daily cleanup at midnight |
| `report-generate` | `queue.service.ts` worker | Daily summary at 07:00 |

Existing `kpi-recalc` worker updated to use `kpiEngine` instead of `kpiService`.

### 8. New API Routes

| Route | Purpose |
|---|---|
| `GET /api/notifications` | Paginated notification list |
| `PATCH /api/notifications/:id/read` | Mark notification as read |
| `POST /api/engine/reports/generate` | Trigger report generation |
| `GET /api/engine/reports` | List generated reports |
| `GET /api/engine/reports/:id` | Report status/details |
| `GET /api/engine/kpi/definitions` | KPI definition catalog |
| `GET /api/engine/kri/definitions` | KRI definition catalog |
| `POST /api/engine/kpi/recalculate` | Trigger KPI recalculation |
| `GET /api/engine/workflow/active` | List active workflow instances |

## Architecture Decisions
- Event bus uses in-process `EventEmitter` (not Redis) for low-latency synchronous handlers; async handlers are parallelized with `Promise.all`
- Notification engine subscribes to ALL events via `"*"` wildcard, evaluates rules by `event_type` match — maintains loose coupling
- Workflow engine stores definitions as JSONB for maximum flexibility (no schema changes needed for new workflows)
- KPI engine is additive — existing `kpi.service.ts` untouched for backward compatibility; `kpi-recalc` queue worker switched to engine

## Files Created
- `backend/migrations/032_phase6_engines.sql`
- `backend/src/core/events/types.ts`
- `backend/src/core/events/eventBus.ts`
- `backend/src/core/events/eventStore.ts`
- `backend/src/services/engines/workflow.engine.ts`
- `backend/src/services/engines/notification.engine.ts`
- `backend/src/services/engines/reporting.engine.ts`
- `backend/src/services/engines/kpi.engine.ts`
- `backend/src/services/queues/notificationDispatchWorker.ts`
- `backend/src/routes/notification.routes.ts`
- `backend/src/routes/engine-report.routes.ts`

## Files Modified
- `backend/src/app.ts` — registered notification + engine routes
- `backend/src/index.ts` — notification engine initialization on startup
- `backend/src/services/queue.service.ts` — added 2 new queues + workers, updated kpi-recalc worker

## Verification
- All existing dashboards return 200
- Engine API endpoints return 200 (empty arrays for new tables)
- Migration 032 applied successfully

## Next Steps
Phase 7 — Frontend Refactoring (monolithic page decomposition, shared types, standardized patterns)
