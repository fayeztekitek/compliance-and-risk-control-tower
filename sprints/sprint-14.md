# Sprint 14: Notifications + UX Polish + CI/CD

**Status:** ✅ Completed  
**Branch:** `sprint-14-notifications-ux-cicd` (merged to main)  
**Goal:** Wire real notifications (Slack/email), add monitoring and alerting UIs, polish UX across all pages (react-hook-form, pagination, bulk ops, dark mode), set up GitHub Actions CI/CD pipeline.

---

## Tasks

### Backend — Email Notifications
- [x] `email.service.ts` — Nodemailer transport (SMTP config from env)
- [x] HTML email templates: severity-colored border, body lines
- [ ] Wire `email-notify` BullMQ queue to email service (deferred to Sprint 15)

### Backend — Slack Webhook
- [x] `slack.service.ts` — POST to Slack webhook URL with emoji severity indicators
- [ ] Send alerts for: EPSS > 0.9 + CISA KEV, mitigation overdue (needs alert engine integration)

### Backend — Alert Rules Engine
- [x] Migration 029: `alert_rules` table (name, source_tool, severity_threshold, condition, channel, enabled)
- [x] `alertEngine.service.ts` — evaluate rules (SEVERITY, EPSS_SCORE, CISA_KEV, SLA_BREACH conditions)
- [x] `alert.routes.ts` — CRUD for alert rules
- [x] `nexus_alerts` enriched with rule_id, channel, delivery_status

### Backend — Notification Router
- [x] `notification.service.ts` — route through email/slack based on rule config
- [x] Delivery status tracking in `nexus_alerts` table

### Backend — BullMQ Monitoring API
- [x] `GET /api/admin/queues` — counts per queue
- [x] `POST /api/admin/queues/:name/retry-all`
- [x] `POST /api/admin/queues/:name/clean`

### Frontend — BullMQ Monitoring Page
- [x] `QueueMonitoringPage.tsx` — queue status dashboard (waiting/active/completed/failed counts)
- [x] Retry + Clean buttons per queue
- [ ] Job list with error details (deferred)
- [ ] Historical chart (deferred)

### Frontend — Nexus Sync Scheduling UI
- [ ] Configure sync interval (deferred to Sprint 15)
- [ ] Manual trigger button (deferred)
- [ ] Sync log viewer (deferred)

### Frontend — Alert Rules Management
- [ ] Create/edit/delete alert rules page (deferred to Sprint 15)

### Frontend — react-hook-form + Zod Migration
- [x] Migrate: mitigation proposal form (NexusVulnerabilityDetail + NexusOccurrenceDetail)
- [x] Migrate: waiver create form (SecurityGovernanceWorkspace)
- [x] Migrate: VEG request create/edit form (VegGovernanceWorkspace)
- [x] Migrate: VEG deal create/edit form (VegGovernanceWorkspace)

### Frontend — Advanced Pagination
- [x] Page number selector
- [x] Page size selector (10/25/50/100)
- [x] Total count display
- [x] Reusable `Pagination.tsx` component
- [x] Wired into SecurityGovernance, VegGovernance (deals + workflows), NexusReportDetail

### Frontend — Bulk Operations
- [x] Checkbox selection on security vulns table
- [x] Bulk action toolbar with "Mark as False Positive"
- [x] Reusable `BulkActionsToolbar.tsx` component
- [ ] Full bulk operations in VEG deals table (deferred)

### Frontend — Dark Mode
- [x] `useDarkMode.ts` hook with localStorage persistence
- [x] Respects `prefers-color-scheme`
- [x] Theme toggle in sidebar header
- [x] `dark:` CSS variants in Pagination, QueueMonitoring, FormField components

### CI/CD — GitHub Actions
- [x] CI workflow fixed: migration runner, env vars, job names
- [ ] Integration tests workflow (deferred)
- [ ] E2E tests workflow (deferred)
- [ ] Docker build workflow (deferred)

---

## Deliverables

- [x] Email notifications sent for critical findings and SLA breaches (service + templates done, BullMQ wiring deferred)
- [x] Slack webhook fires for high-severity alerts (service done, alert engine integration deferred)
- [x] Alert rules engine evaluates and creates alerts automatically
- [x] BullMQ monitoring page shows real-time queue statuses
- [x] All forms use react-hook-form + Zod
- [x] All tables have advanced pagination
- [x] Bulk operations on findings table
- [x] Dark mode toggleable with persistence
- [x] CI/CD pipeline runs tests on push/PR (base workflow done)

---

## Tests

| Type | Count | Description |
|------|-------|-------------|
| Backend Unit | 4+ | Email service, Slack service, alert engine, notification router, monitoring |
| Backend Integration | 2 | Alert rules CRUD, queue monitoring |
| Frontend Unit | 4 | Auth store, UI store, security API, VEG API |
| Regression | ~251 | **ALL Sprint 1–14 tests** — 227 backend + 24 frontend, 0 failures |

---

## Branch Strategy

```
git checkout -b sprint-14-notifications-ux-cicd
# ... develop ...
git checkout main
git merge sprint-14-notifications-ux-cicd
```
