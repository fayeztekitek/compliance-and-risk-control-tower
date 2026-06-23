# Sprint 14: Notifications + UX Polish + CI/CD

**Status:** 🔄 In Progress  
**Branch:** `sprint-14-notifications-ux-cicd`  
**Goal:** Wire real notifications (Slack/email), add monitoring and alerting UIs, polish UX across all pages (react-hook-form, pagination, bulk ops, dark mode), set up GitHub Actions CI/CD pipeline.

---

## Tasks

### Backend — Email Notifications
- [ ] `email.service.ts` — Nodemailer transport (SMTP config from env)
- [ ] HTML email templates: critical finding alert, SLA breach, waiver expiry, VEG approval required
- [ ] Wire `email-notify` BullMQ queue to email service

### Backend — Slack Webhook
- [ ] `slack.service.ts` — POST to Slack webhook URL
- [ ] Send alerts for: EPSS > 0.9 + CISA KEV, mitigation overdue, VEG request submitted

### Backend — Alert Rules Engine
- [ ] Migration 026: `alert_rules` table (name, source_tool, severity_threshold, channel, enabled)
- [ ] `alertEngine.service.ts` — evaluate rules on finding sync/update
- [ ] `alert.routes.ts` — CRUD for alert rules
- [ ] Auto-create `nexus_alerts` on match

### Backend — Notification Router
- [ ] `notification.service.ts` — route through email/slack/based on rule config
- [ ] Delivery status tracking

### Backend — BullMQ Monitoring API
- [ ] `GET /api/admin/queues` — counts per queue
- [ ] `POST /api/admin/queues/:name/retry-all`
- [ ] `POST /api/admin/queues/:name/clean`

### Frontend — BullMQ Monitoring Page
- [ ] Queue status dashboard (waiting/active/completed/failed counts)
- [ ] Retry buttons per queue
- [ ] Job list with error details
- [ ] Historical chart

### Frontend — Nexus Sync Scheduling UI
- [ ] Configure sync interval
- [ ] Manual trigger button
- [ ] Sync log viewer with status badges

### Frontend — Alert Rules Management
- [ ] Create/edit/delete alert rules
- [ ] Test rule button
- [ ] Enable/disable toggle

### Frontend — react-hook-form + Zod Migration
- [ ] Migrate: mitigation proposal form
- [ ] Migrate: waiver create form
- [ ] Migrate: VEG request create/edit form
- [ ] Migrate: VEG deal create/edit form

### Frontend — Advanced Pagination
- [ ] Page number selector
- [ ] Page size selector (10/25/50/100)
- [ ] Total count display
- [ ] "Go to page" input
- [ ] Reusable `Pagination.tsx` component

### Frontend — Bulk Operations
- [ ] Checkbox selection on tables
- [ ] Bulk action toolbar: batch assign owner, batch change status
- [ ] Confirmation dialog
- [ ] Apply to: findings table, VEG deals table

### Frontend — Dark Mode
- [ ] CSS custom properties for theming
- [ ] Theme toggle in sidebar header
- [ ] localStorage persistence
- [ ] Respects `prefers-color-scheme`

### CI/CD — GitHub Actions
- [ ] Unit tests workflow (backend + frontend vitest on push/PR)
- [ ] Integration tests workflow (PostgreSQL service container)
- [ ] Lint + TypeScript check workflow (ESLint + tsc --noEmit)
- [ ] E2E tests workflow (Playwright)
- [ ] Docker build workflow (build + push on merge to main)

---

## Deliverables

- [ ] Email notifications sent for critical findings and SLA breaches
- [ ] Slack webhook fires for high-severity alerts
- [ ] Alert rules engine evaluates and creates alerts automatically
- [ ] BullMQ monitoring page shows real-time queue statuses
- [ ] All forms use react-hook-form + Zod
- [ ] All tables have advanced pagination
- [ ] Bulk operations work on findings and deals
- [ ] Dark mode toggleable with persistence
- [ ] CI/CD pipeline runs tests on push/PR

---

## Tests

| Type | Count | Description |
|------|-------|-------------|
| Backend Unit | 6 | Email service, Slack service, alert engine, notification router, monitoring |
| Backend Integration | 2 | Alert rules CRUD, queue monitoring |
| Frontend Unit | 6 | Monitoring page, alert rules, react-hook-form, dark mode, pagination, bulk ops |
| CI Validation | 2 | Workflow dry-run, E2E workflow |
| Regression | ~232 | **ALL Sprint 1–13 tests** |

---

## Branch Strategy

```
git checkout -b sprint-14-notifications-ux-cicd
# ... develop ...
git checkout main
git merge sprint-14-notifications-ux-cicd
```
