# Phase 2: Enterprise Architecture

> Status: ✅ Approved
> 
> REDESIGN SCOPE: Domain Model, Information Architecture, Navigation, UX, Permission Model, Database, Backend, Frontend, API, Integration, Notification, Workflow Engine, Reporting Engine, Security, AI, MCP, Knowledge Base

---

## 1. Domain-Driven Design — Bounded Contexts

### Overview

The platform is decomposed into **12 bounded contexts**, each with its own ubiquitous language, aggregate roots, and domain events. Existing contexts are preserved and extended; new contexts are introduced for gaps identified in Phase 1.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     ENTERPRISE GRC PLATFORM                                │
│                                                                           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐          │
│  │ Executive  │  │   VEG      │  │  Security  │  │ Compliance │          │
│  │ Oversight  │  │ Governance │  │ Governance │  │ Management │          │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘          │
│                                                                           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐          │
│  │   Audit    │  │    SaaS    │  │  Roadmaps  │  │ Committees │          │
│  │ Management │  │ Governance │  │ & Projects │  │ & Assembly │          │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘          │
│                                                                           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐          │
│  │   Risk     │  │  Privacy / │  │  Identity  │  │    AI /    │          │
│  │ Management │  │   GDPR     │  │ & Access   │  │ Knowledge  │          │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Bounded Contexts Detail

#### 1. Executive Oversight (NEW)
- **Aggregate Roots:** `ExecutiveSnapshot`, `KpiDefinition`, `KriDefinition`, `Alert`
- **Domain Events:** `SnapshotGenerated`, `KpiThresholdCrossed`, `AlertTriggered`
- **Existing Artifacts:** ExecutiveDashboard, KPIs, KRIs (partial)
- **New:** KPI/KRI config UI, alert rules engine UI, automated COMEX pack generator

#### 2. VEG Governance (EXISTING)
- **Aggregate Roots:** `VegRequest`, `VegDeal`, `Opportunity`, `Contract`
- **Domain Events:** `VegSubmitted`, `SignoffCompleted`, `DecisionMade`, `DealWon`, `DealLost`
- **Existing Artifacts:** Full backend + frontend (VegGovernanceWorkspace 1200 lines)
- **New:** Document management, negotiation tracking, action tracker, Chronos integration

#### 3. Security Governance (EXISTING)
- **Aggregate Roots:** `Vulnerability`, `Waiver`, `RiskAcceptance`, `SlaIncident`, `ScanImport`
- **Domain Events:** `VulnDetected`, `WaiverApproved`, `SlaBreached`, `FalsePositiveDeclared`
- **Existing Artifacts:** Full backend + frontend (SecurityGovernanceWorkspace 456 lines)
- **New:** Penetration test management, security committee automation, policy violation tracking

#### 4. Compliance Management (EXISTING — EXTEND)
- **Aggregate Roots:** `ComplianceFramework`, `RegulatoryMapping`, `ComplianceControl`, `ComplianceClassification`, `AwarenessCampaign`
- **Domain Events:** `ControlTested`, `BreachDetected`, `AutoClassified`, `CampaignCompleted`
- **Existing Artifacts:** ComplianceWorkspace, SLA breach detection, auto-classification
- **New:** Control testing UI, evidence repository, awareness campaigns, compliance calendar

#### 5. Audit Management (EXISTING — EXTEND)
- **Aggregate Roots:** `Audit`, `AuditFinding`, `CapiItem`, `AccessReview`, `AuditProgram`
- **Domain Events:** `AuditScheduled`, `FindingRaised`, `CapiCompleted`, `AccessReviewDue`
- **Existing Artifacts:** AuditWorkspace, CAPA CRUD
- **New:** Evidence upload UI, access review module, dormant account detection, audit calendar

#### 6. SaaS Governance (EXISTING — EXTEND)
- **Aggregate Roots:** `SaaSApplication`, `PrivacyAssessment`, `SaaSContract`, `ReadinessCheck`
- **Domain Events:** `SaaSOnboarded`, `GoLiveApproved`, `PrivacyAssessmentCompleted`, `SaaSDeactivated`
- **Existing Artifacts:** SaaSGovernanceWorkspace, basic privacy checklist
- **New:** Onboarding/offboarding workflow, cost analytics, contract management, DPA workflow

#### 7. Roadmaps & Projects (EXISTING — EXTEND)
- **Aggregate Roots:** `Project`, `Roadmap`, `RtdSubmission`, `Milestone`
- **Domain Events:** `ProjectCreated`, `RtdDeclared`, `MilestoneReached`, `BudgetExceeded`
- **Existing Artifacts:** RoadmapWorkspace, RTD tracking
- **New:** Chronos sync, budget monitoring, project information sheets, milestone gates

#### 8. Committees & Assembly (EXISTING — EXTEND)
- **Aggregate Roots:** `Committee`, `CommitteeDecision`, `Obligation`, `MeetingMinute`
- **Domain Events:** `CommitteeScheduled`, `DecisionRecorded`, `ObligationOverdue`
- **Existing Artifacts:** CommitteeWorkspace, decisions CRUD
- **New:** Automated minutes, obligation enforcement, meeting calendar sync

#### 9. Risk Management (EXISTING — REORGANIZE)
- **Aggregate Roots:** `RiskRegister`, `RiskAssessment`, `KriValue`, `RiskTreatment`
- **Domain Events:** `RiskIdentified`, `KriExceeded`, `TreatmentApproved`
- **Existing Artifacts:** Risk score engine (8-factor), risk acceptances, waived risks
- **New:** Full risk register, KRI dashboard, risk appetite configuration, risk heatmap

#### 10. Privacy / GDPR (EXISTING — REORGANIZE)
- **Aggregate Roots:** `DataInventory`, `DpiaRequest`, `ConsentRecord`, `DataSubjectRequest`
- **Domain Events:** `DataInventoryUpdated`, `DpiaCompleted`, `DsrReceived`, `DsrFulfilled`
- **Existing Artifacts:** Privacy checklist in SaaS module
- **New:** Full data inventory, DPIA workflow, DSR handling, consent management

#### 11. Identity & Access (NEW)
- **Aggregate Roots:** `User`, `Role`, `Permission`, `AccessReview`
- **Domain Events:** `UserDeactivated`, `RoleChanged`, `AccessReviewDue`, `DormantAccountDetected`
- **Existing Artifacts:** Auth service, RBAC middleware, user management
- **New:** Access review module, dormant account detection, privileged access monitoring

#### 12. AI & Knowledge (NEW)
- **Aggregate Roots:** `Conversation`, `Document`, `PromptTemplate`, `AiAgent`, `KnowledgeArticle`
- **Domain Events:** `DocumentIndexed`, `AgentTaskCompleted`, `InsightGenerated`
- **Existing Artifacts:** None
- **New:** AI platform (copilots, agents, RAG, prompt library)

### Cross-Cutting Domain Events

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         DOMAIN EVENT BUS                                  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  VEG ──────► DealWon ──────────────────► Roadmaps ────► ProjectCreated    │
│               │                                                           │
│               └─────────► SaaS ──► GoLiveApproved                         │
│                                                                           │
│  Security ──► VulnDetected ──► Compliance ──► AutoClassified             │
│               │                                                           │
│               ├──► WaiverApproved ──► Risk ──► RiskAccepted               │
│               │                                                           │
│               └──► SlaBreached ──► Executive ──► AlertTriggered           │
│                                                                           │
│  Audit ─────► FindingRaised ──► Compliance ──► ControlRequired            │
│                                                                           │
│  Committees ─► DecisionRecorded ──► VEG ──► DecisionApplied               │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Information Architecture & Navigation

### Navigation Structure

The new navigation reorganizes the existing 9 domains into **11 primary groups** with executive dashboards for each:

```
Executive                         │  Compliance
├── Executive Dashboard (/)       │  ├── Dashboard
├── COMEX Dashboard               │  ├── Operational Assurance
├── Executive Reports             │  ├── Compliance Controls
├── Alerts & Notifications        │  ├── Contractual Obligations
│                                 │  ├── Awareness Campaigns
Organizations                     │  ├── Compliance Register
├── Organizations                 │  └── Compliance Reports
├── Applications                  │
├── Nexus IQ Overview             │  Risk
│                                 │  ├── Dashboard (KRIs)
VEG Governance                    │  ├── Risk Register
├── COMEX Dashboard               │  ├── Risk Assessment
├── Deal Register                 │  ├── Risk Treatment
├── Workflow Requests             │  └── Risk Reports
├── Decisions                     │
├── Client Negotiation            │  Committees
├── Contract Signature            │  ├── Dashboard
├── Opportunity Timeline          │  ├── VEG Committee
├── Documents                     │  ├── Vulnerability Committee
├── Action Tracker                │  ├── Executive Security Committee
└── Reports                       │  ├── SaaS Steering Committee
                                  │  ├── Roadmap Committee
Security Governance               │  ├── Meeting Minutes
├── Dashboard                     │  └── Decisions
├── Vulnerabilities               │
├── Vulnerability Register        │  Administration
├── Risk Acceptances              │  ├── Users
├── Waived Risks                  │  ├── Roles & Permissions
├── False Positives               │  ├── Reference Data
├── Policy Violations             │  ├── KPI Configuration
├── SLA Breaches                  │  ├── Notification Rules
├── Security Committees           │  ├── Integrations
├── Penetration Tests             │  ├── Audit Logs
└── Security Reports              │  └── System Settings

Roadmaps & Projects               │  AI Assistant
├── Dashboard                     │  ├── Executive Copilot
├── Roadmaps                      │  ├── Compliance Copilot
├── Projects                      │  ├── Security Copilot
├── RTD Monitoring                │  ├── Audit Copilot
├── Chronos Monitoring            │  ├── VEG Copilot
├── Budget Monitoring             │  ├── Document Analyzer
├── Schedule Monitoring           │  ├── Prompt Library
└── Project Information Sheets    │  ├── AI Agents
                                  │  ├── MCP Configuration
SaaS Governance                   │  └── AI Settings
├── Dashboard
├── SaaS Applications
├── Onboarding
├── Go-Live Readiness
├── Privacy / GDPR
├── Data Inventory
└── Contracts

Audits
├── Dashboard
├── Audit Planning
├── Audits
├── Findings
├── Evidence
├── CAPA
├── Access Reviews
└── Contractual Audits
```

### Route Map (New)

| Path | Component | Navigation Group |
|------|-----------|-----------------|
| `/` | `ExecutiveDashboard` | Executive |
| `/comex` | `ComexDashboard` | Executive |
| `/executive/reports` | `ExecutiveReportsPage` | Executive |
| `/executive/alerts` | `AlertsPage` | Executive |
| `/organizations` | `OrganizationsPage` | Organizations |
| `/applications` | `ApplicationsPage` | Organizations |
| `/nexus` | `NexusOverview` | Organizations |
| `/veg` | `VegGovernanceWorkspace` | VEG |
| `/veg/dashboard` | `VegComexDashboard` | VEG |
| `/veg/list` | `VegGovernanceWorkspace` | VEG |
| `/veg/deal/:dealId` | `VegGovernanceWorkspace` | VEG |
| `/veg/workflow` | `VegGovernanceWorkspace` | VEG |
| `/veg/decisions` | `VegDecisionsPage` | VEG |
| `/veg/documents` | `VegDocumentsPage` | VEG |
| `/veg/negotiation` | `VegNegotiationPage` | VEG |
| `/veg/timeline` | `VegTimelinePage` | VEG |
| `/veg/actions` | `VegActionTrackerPage` | VEG |
| `/security` | `SecurityGovernanceWorkspace` | Security |
| `/security/dashboard` | `SecurityDashboardPage` | Security |
| `/security/vulnerabilities` | `VulnerabilitiesPage` | Security |
| `/security/waivers` | `WaiversPage` | Security |
| `/security/risk-acceptances` | `RiskAcceptancesPage` | Security |
| `/security/pentests` | `PenTestPage` | Security |
| `/security/reports` | `SecurityReportsPage` | Security |
| `/roadmaps` | `RoadmapWorkspace` | Roadmaps |
| `/roadmaps/dashboard` | `RoadmapDashboardPage` | Roadmaps |
| `/roadmaps/projects` | `ProjectsPage` | Roadmaps |
| `/roadmaps/rtd` | `RtdPage` | Roadmaps |
| `/saas` | `SaaSGovernanceWorkspace` | SaaS |
| `/saas/dashboard` | `SaaSDashboardPage` | SaaS |
| `/saas/onboarding` | `SaaSOnboardingPage` | SaaS |
| `/saas/privacy` | `SaaSPrivacyPage` | SaaS |
| `/audits` | `AuditWorkspace` | Audits |
| `/audits/dashboard` | `AuditDashboardPage` | Audits |
| `/audits/planning` | `AuditPlanningPage` | Audits |
| `/audits/access-reviews` | `AccessReviewPage` | Audits |
| `/compliance` | `ComplianceWorkspace` | Compliance |
| `/compliance/dashboard` | `ComplianceDashboardPage` | Compliance |
| `/compliance/controls` | `ComplianceControlsPage` | Compliance |
| `/compliance/campaigns` | `AwarenessCampaignsPage` | Compliance |
| `/risk` | `RiskWorkspace` | Risk |
| `/risk/dashboard` | `RiskDashboardPage` | Risk |
| `/risk/register` | `RiskRegisterPage` | Risk |
| `/committees` | `CommitteeWorkspace` | Committees |
| `/committees/dashboard` | `CommitteeDashboardPage` | Committees |
| `/admin` | `AdminWorkspace` | Administration |
| `/ai` | `AiHubPage` | AI Assistant |
| `/ai/copilot/:domain` | `CopilotPage` | AI Assistant |
| `/ai/agents` | `AiAgentsPage` | AI Assistant |
| `/ai/prompts` | `PromptLibraryPage` | AI Assistant |

### UX Enhancements

| Feature | Current | Target |
|---------|---------|--------|
| Global Search | ❌ None | 🔍 CTRL+K command palette + search box in header |
| Favorites | ❌ None | ⭐ Star sidebar items per user |
| Recent Pages | ❌ None | 🕐 Show last 5 visited in sidebar |
| Notification Center | ❌ None | 🔔 Bell icon in header with badge |
| Saved Views | ❌ None | 💾 Save filter/tab state per page |
| Breadcrumbs | ❌ None | 📍 Below header, clickable path |
| Dark/Light Theme | ⚠️ Partial | ✅ Full consistent theme across all pages |
| Keyboard Shortcuts | ❌ None | ⌨️ `g + h` home, `g + s` security, etc. |
| Responsive | ❌ None | 📱 Collapsible sidebar, stacked layouts |

---

## 3. Permission Model — Extended RBAC

### Role Hierarchy (Extended)

| Role | Level | Added Permissions |
|------|-------|-------------------|
| `SUPER_ADMIN` | 200 | All, including AI config, MCP config, system settings |
| `ADMIN` | 100 | User management, integrations, reference data (existing) |
| `COMPLIANCE_OFFICER` | 80 | Compliance controls, awareness campaigns, evidence mgmt |
| `RISK_MANAGER` | 70 | Full risk register, KRIs, risk treatment |
| `SECURITY_MANAGER` | 60 | PenTests, security reports (existing + extended) |
| `PRODUCT_OWNER` | 50 | Roadmap budget, SaaS contracts, project info sheets |
| `AUDITOR` | 40 | Full audit access, evidence review, access reviews |
| `EXECUTIVE_READ_ONLY` | 30 | Dashboards, reports, AI copilot read-only |
| `GDPR_OFFICER` | 25 | Data inventory, DPIA, DSR, consent management (NEW) |
| `DEVELOPER` | 20 | Own vulnerabilities, PR compliance checks (NEW) |

### Permission Areas (Extended)

```
PERMISSION_MATRIX = {
  executive:        [SUPER_ADMIN, ADMIN, EXECUTIVE_READ_ONLY],
  veg:              [SUPER_ADMIN, ADMIN, COMPLIANCE_OFFICER, RISK_MANAGER, PRODUCT_OWNER, EXECUTIVE_READ_ONLY],
  security:         [SUPER_ADMIN, ADMIN, SECURITY_MANAGER, RISK_MANAGER, AUDITOR, EXECUTIVE_READ_ONLY],
  compliance:       [SUPER_ADMIN, ADMIN, COMPLIANCE_OFFICER, RISK_MANAGER, SECURITY_MANAGER, AUDITOR, EXECUTIVE_READ_ONLY],
  audit:            [SUPER_ADMIN, ADMIN, AUDITOR, COMPLIANCE_OFFICER, RISK_MANAGER, EXECUTIVE_READ_ONLY],
  saas:             [SUPER_ADMIN, ADMIN, COMPLIANCE_OFFICER, PRODUCT_OWNER, SECURITY_MANAGER, EXECUTIVE_READ_ONLY],
  roadmaps:         [SUPER_ADMIN, ADMIN, PRODUCT_OWNER, RISK_MANAGER, EXECUTIVE_READ_ONLY],
  committees:       [SUPER_ADMIN, ADMIN, COMPLIANCE_OFFICER, RISK_MANAGER, SECURITY_MANAGER, PRODUCT_OWNER, EXECUTIVE_READ_ONLY],
  risk:             [SUPER_ADMIN, ADMIN, RISK_MANAGER, COMPLIANCE_OFFICER, SECURITY_MANAGER, EXECUTIVE_READ_ONLY],
  privacy:          [SUPER_ADMIN, ADMIN, COMPLIANCE_OFFICER, GDPR_OFFICER, AUDITOR],
  admin:            [SUPER_ADMIN, ADMIN, COMPLIANCE_OFFICER],
  ai:               [SUPER_ADMIN, ADMIN, COMPLIANCE_OFFICER, RISK_MANAGER, SECURITY_MANAGER, AUDITOR, EXECUTIVE_READ_ONLY],
}
```

### Implementation Pattern

```typescript
// Extend existing RBAC middleware with granular permissions
type Permission =
  | "executive:read"
  | "veg:read" | "veg:write" | "veg:delete"
  | "security:read" | "security:write"
  | "compliance:controls:test"
  | "compliance:campaigns:manage"
  | "audit:evidence:upload"
  | "risk:kri:configure"
  | "privacy:dpia:approve"
  | "ai:execute";

// New middleware: requirePermission("veg:write")
// Existing hierarchy-based check preserved for backwards compat
```

---

## 4. Database Architecture

### Current Schema Foundation (to preserve)

55 existing migrations, 44+ tables. The following tables form the foundation:

```
users, committees, committee_decisions, committee_obligations,
veg_requests, veg_signoffs, veg_opportunities, veg_contracts,
veg_deals (44 columns), vulnerabilities, waivers, risk_acceptances,
sla_incidents, security_scans, projects, roadmaps, rtd_submissions,
saas_applications, privacy_assessments, audits, audit_findings,
capi_items, unified_findings (37+ columns), findings_archive,
nexus_applications, nexus_reports, nexus_policy_violations,
mitigations, finding_occurrences, finding_components, scan_reports,
compliance_classifications, regulatory_mappings, policy_rules,
alert_rules, organizations, dashboard_pages, activity_logs
```

### New Tables (Phase 2+)

```sql
-- Executive
CREATE TABLE kpi_definitions (id, name, category, formula, target, threshold, unit);
CREATE TABLE kri_definitions (id, name, category, formula, red_threshold, amber_threshold);
CREATE TABLE kpi_snapshots (id, kpi_id, value, timestamp);
CREATE TABLE kri_snapshots (id, kri_id, value, status, timestamp);
CREATE TABLE executive_reports (id, type, config, generated_at, content);

-- Compliance Extensions
CREATE TABLE compliance_controls (id, framework_id, name, frequency, automated, last_test_result);
CREATE TABLE control_test_results (id, control_id, result, evidence_url, tested_by, tested_at);
CREATE TABLE awareness_campaigns (id, title, target_audience, due_date, completion_rate);
CREATE TABLE campaign_assignments (id, campaign_id, user_id, completed, completed_at);

-- Audit Extensions
CREATE TABLE audit_evidence (id, finding_id, file_url, description, uploaded_by, uploaded_at);
CREATE TABLE access_reviews (id, title, scope, due_date, status, completed_at);
CREATE TABLE access_review_findings (id, review_id, user_id, finding_type, status);
CREATE TABLE dormant_accounts (id, user_id, last_active, detected_at, status);

-- Risk
CREATE TABLE risk_register (id, title, category, likelihood, impact, risk_score, status, owner);
CREATE TABLE risk_treatments (id, risk_id, treatment_type, description, due_date, status);
CREATE TABLE risk_assessments (id, risk_id, assessed_by, score_before, score_after, notes);

-- Privacy / GDPR
CREATE TABLE data_inventory (id, system, data_category, retention_period, dpia_required);
CREATE TABLE dpia_requests (id, system_id, status, risk_level, approved_by, approved_at);
CREATE TABLE consent_records (id, user_id, purpose, granted_at, expires_at);
CREATE TABLE dsr_requests (id, user_id, request_type, status, fulfilled_at);

-- VEG Extensions
CREATE TABLE veg_documents (id, veg_id, file_url, document_type, uploaded_by, uploaded_at);
CREATE TABLE veg_negotiations (id, deal_id, stage, notes, decided_by);
CREATE TABLE veg_action_items (id, deal_id, description, owner, due_date, status);

-- Integration Credentials (replaces hardcoded config)
CREATE TABLE integration_credentials (id, provider, credentials_encrypted, config, last_sync, status);
CREATE TABLE sync_logs (id, integration_id, entity_type, status, records_processed, error_details);

-- Workflow Engine
CREATE TABLE workflow_definitions (id, name, domain, states_json, transitions_json);
CREATE TABLE workflow_instances (id, definition_id, entity_type, entity_id, current_state, context);
CREATE TABLE workflow_actions (id, instance_id, action, from_state, to_state, performed_by, performed_at);

-- AI / Knowledge
CREATE TABLE conversations (id, user_id, domain, title, message_count, created_at);
CREATE TABLE conversation_messages (id, conversation_id, role, content, tokens_used);
CREATE TABLE knowledge_articles (id, domain, title, content, embedding, tags);
CREATE TABLE prompt_templates (id, domain, name, template, variables);
CREATE TABLE ai_agents (id, name, domain, objectives, tools, config);
CREATE TABLE agent_tasks (id, agent_id, objective, status, result, started_at, completed_at);

-- Notification
CREATE TABLE notification_rules (id, domain, event_type, channel, recipient_config);
CREATE TABLE notifications (id, user_id, title, body, type, read, created_at);

-- Reporting
CREATE TABLE report_templates (id, name, domain, sections_json, schedule_cron);
CREATE TABLE report_instances (id, template_id, parameters, generated_at, file_url, status);
```

---

## 5. Backend Architecture

### Layered Structure (Preserve + Extend)

```
backend/src/
├── app.ts                                  # Express app setup (extend routes)
├── index.ts                                # Server startup (extend workers)
├── config/                                 # Config (preserve)
│   ├── env.ts
│   ├── database.ts
│   └── swagger.ts
├── core/                                   # Extend with engines
│   ├── errors.ts
│   ├── logger.ts
│   └── events/                             # NEW: Domain Event Bus
│       ├── eventBus.ts
│       ├── eventStore.ts
│       └── subscribers/
├── middleware/                             # Preserve + extend
│   ├── auth.middleware.ts
│   ├── rbac.middleware.ts                  # Add granular permission check
│   ├── rateLimit.middleware.ts
│   ├── correlation.middleware.ts
│   └── error.middleware.ts
├── routes/                                 # 26 → 35 modules
├── controllers/                            # NEW: thin HTTP adapters
│   ├── base.controller.ts
│   ├── veg.controller.ts
│   ├── security.controller.ts
│   └── ...
├── services/                               # 36 → ~50 files
│   ├── veg/
│   │   ├── veg.service.ts
│   │   ├── veg-deal.service.ts
│   │   ├── veg-events.service.ts
│   │   ├── vegSlaWorker.ts
│   │   └── veg-document.service.ts        # NEW
│   ├── security/
│   ├── compliance/
│   │   ├── compliance.service.ts
│   │   ├── compliance-control.service.ts  # NEW
│   │   └── awareness-campaign.service.ts  # NEW
│   ├── audit/
│   │   ├── audit.service.ts
│   │   ├── evidence.service.ts            # NEW
│   │   └── access-review.service.ts       # NEW
│   ├── risk/
│   │   ├── riskScore.service.ts
│   │   ├── risk-register.service.ts       # NEW
│   │   └── kri.service.ts                 # NEW
│   ├── privacy/
│   │   ├── dpia.service.ts                # NEW
│   │   ├── dsr.service.ts                 # NEW
│   │   └── data-inventory.service.ts      # NEW
│   ├── ai/
│   │   ├── copilot.service.ts             # NEW
│   │   ├── agent.service.ts               # NEW
│   │   └── rag.service.ts                 # NEW
│   ├── integrations/
│   │   ├── nexus/                         # Preserve
│   │   ├── fortify/                       # Preserve
│   │   ├── chronos/                       # NEW
│   │   ├── jira/                          # NEW
│   │   └── mcp/                           # NEW: MCP gateway
│   ├── engines/                           # NEW
│   │   ├── workflow.engine.ts
│   │   ├── notification.engine.ts
│   │   ├── reporting.engine.ts
│   │   └── kpi.engine.ts
│   └── workers/                           # BullMQ workers (extend)
├── repositories/                          # 13 → ~25 files
│   ├── base/                              # NEW: CrudRepository base
│   │   └── crud.repository.ts
│   ├── veg/
│   ├── security/
│   └── ...
├── validation/                            # Zod schemas (extend)
│   ├── veg.schema.ts
│   ├── security.schema.ts
│   ├── compliance.schema.ts              # NEW
│   ├── risk.schema.ts                    # NEW
│   └── ...
├── shared/                                # NEW: shared types package
│   ├── types/
│   │   ├── common.ts
│   │   ├── veg.types.ts
│   │   └── ...
│   └── constants.ts
├── migrations/                            # Preserve 55 files + add new
├── scripts/                               # Preserve
└── __tests__/                             # Extend
```

### Service Layer Pattern

```typescript
// Standard service pattern for all domains:
class DomainService {
  constructor(
    private repo: DomainRepository,
    private eventBus: EventBus,
    private logger: Logger
  ) {}

  async create(data: CreateDto): Promise<DomainAggregate> {
    const entity = await this.repo.create(data);
    this.eventBus.publish(new DomainCreatedEvent(entity));
    return entity;
  }

  async findById(id: string): Promise<DomainAggregate> {
    return this.repo.findById(id);
  }

  async findMany(filters: FilterDto): Promise<PaginatedResult<DomainAggregate>> {
    return this.repo.findMany(filters);
  }
}
```

### Workflow Engine

```typescript
// Abstract workflow engine replacing hardcoded state machines
interface WorkflowDefinition {
  name: string;
  domain: string;
  states: WorkflowState[];
  transitions: WorkflowTransition[];
}

interface WorkflowTransition {
  from: string;
  to: string;
  action: string;
  guards?: WorkflowGuard[];
  effects?: WorkflowEffect[];
}

// Example: VEG Workflow
const vegWorkflow: WorkflowDefinition = {
  name: "VEG Request Lifecycle",
  domain: "veg",
  states: ["DRAFT", "SUBMITTED", "REVIEW", "COMMITTEE", "NEGOTIATION", "APPROVED", "WON", "LOST"],
  transitions: [
    { from: "DRAFT", to: "SUBMITTED", action: "submit" },
    { from: "SUBMITTED", to: "REVIEW", action: "assign_reviewer" },
    { from: "REVIEW", to: "COMMITTEE", action: "schedule_committee" },
    { from: "COMMITTEE", to: "NEGOTIATION", action: "bid_decision" },
    { from: "NEGOTIATION", to: "APPROVED", action: "approve" },
    { from: "APPROVED", to: "WON", action: "sign_contract" },
    { from: "WON", to: "DELIVERY", action: "create_chronos_project" }, // Integration trigger
  ]
};
```

---

## 6. Frontend Architecture

### Directory Structure (Extend)

```
frontend/src/
├── main.tsx
├── App.tsx                                  # Routes (extend to 45+)
├── index.css
├── api/                                     # Preserve + extend
│   ├── client.ts
│   ├── generated/                           # OpenAPI-generated types
│   ├── veg.api.ts
│   ├── security.api.ts
│   └── ...
├── hooks/                                   # 18 → ~30 files
│   ├── useAuth.ts
│   ├── useVegRequests.ts
│   ├── useCompliance.ts
│   ├── useCrud.ts                           # NEW: generic CRUD hook
│   └── ...
├── store/                                   # Preserve + extend
│   ├── auth.store.ts
│   ├── ui.store.ts
│   ├── dashboardFilter.store.ts
│   ├── notification.store.ts                # NEW
│   └── search.store.ts                      # NEW
├── pages/                                   # 26 → ~50 pages (decompose)
│   ├── executive/
│   │   ├── ExecutiveDashboard.tsx           # Decompose from monolithic
│   │   ├── ComexDashboard.tsx
│   │   └── ExecutiveReportsPage.tsx
│   ├── veg/                                 # Decompose from 1200-line monolith
│   │   ├── VegDashboard.tsx
│   │   ├── VegDealList.tsx
│   │   ├── VegDealDetail.tsx
│   │   ├── VegWorkflowList.tsx
│   │   ├── VegNegotiationPage.tsx
│   │   └── ...
│   ├── security/
│   ├── compliance/
│   ├── audit/
│   ├── risk/
│   ├── ai/
│   │   ├── AiHubPage.tsx
│   │   ├── CopilotChat.tsx
│   │   └── PromptLibraryPage.tsx
│   └── shared/
│       ├── CrudWorkspace.tsx                # NEW: template for list/detail/edit
│       ├── DataTable.tsx                    # NEW: generic data table
│       └── DashboardLayout.tsx              # NEW: dashboard grid template
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx                      # Extend with new nav structure
│   │   ├── AuthLayout.tsx                   # Extract from App.tsx
│   │   ├── Header.tsx                       # NEW: global header
│   │   ├── GlobalSearch.tsx                 # NEW: command palette
│   │   ├── NotificationCenter.tsx           # NEW: bell dropdown
│   │   └── Breadcrumbs.tsx                  # NEW
│   ├── ui/                                  # Preserve + extend
│   │   ├── ErrorBoundary.tsx
│   │   ├── Skeleton.tsx
│   │   ├── Toast.tsx                         # Extend: grouping, priority
│   │   ├── Pagination.tsx
│   │   ├── EmptyState.tsx
│   │   ├── FormField.tsx
│   │   ├── FilterPanel.tsx                  # NEW: generic filter drawer
│   │   ├── DataCard.tsx                     # NEW: generic KPI card
│   │   ├── Badge.tsx                        # NEW: status/severity badges
│   │   └── Modal.tsx                        # NEW: reusable modal
│   ├── charts/                              # Chart wrapper layer
│   │   ├── TrendChart.tsx
│   │   ├── BarChart.tsx
│   │   ├── PieChart.tsx
│   │   └── HeatmapChart.tsx
│   ├── shared/                              # Shared domain components
│   │   ├── KpiCards.tsx
│   │   ├── DecisionsTable.tsx
│   │   └── RiskBadge.tsx
│   └── ai/                                  # NEW: AI components
│       ├── CopilotWidget.tsx
│       ├── ChatMessage.tsx
│       └── PromptInput.tsx
├── schemas/                                 # Extend with all domains
│   ├── forms.ts
│   ├── veg.schema.ts
│   ├── security.schema.ts
│   └── ...
├── types/                                   # Will be replaced by generated
│   └── nexus.ts
├── utils/
│   └── date.ts
├── tests/                                   # Extend to 50+ files
└── e2e/                                     # Extend to 20+ specs
```

### Frontend Architecture Patterns

| Pattern | Current | Target |
|---------|---------|--------|
| Page decomposition | Monolithic workspaces (1200 lines) | Feature-based page modules |
| Data fetching | TanStack Query (useQuery) | Same + useCrud generic hook |
| State management | Zustand (4 stores) | Same + notification store, search store |
| Forms | react-hook-form + zod (per page) | Same + shared form builder component |
| Routing | React Router v7 | Same + lazy loaded route modules |
| Real-time | Polling (refetchInterval) | WebSocket for live updates + polling fallback |
| Search | None | Global search with command palette (CTRL+K) |
| Navigation | Static sidebar | Sidebar + header + breadcrumbs + command palette |
| Error handling | ErrorBoundary + React Query | Same + global error toast middleware |
| Loading | Skeleton components | Same + progressive loading |
| Empty state | EmptyState component | Same + contextual CTA |

---

## 7. API Architecture

### Design Principles

- **RESTful** with consistent naming: `/api/{domain}/{entity}`
- **Versioned** via URL prefix: `/api/v1/{domain}` (start with v1, avoid breaking)
- **Standard response envelope**: `{ data, meta, error }`
- **Pagination**: `{ data: [...], meta: { page, pageSize, total, totalPages } }`
- **Error format**: `{ error: { code, message, details } }` (existing AppError)
- **Filtering**: Query parameters `?field=value&sort=-createdAt`
- **OpenAPI**: Auto-generated from JSDoc annotations (existing pattern)

### Standard CRUD Pattern

| Method | Path | Action |
|--------|------|--------|
| GET | `/api/v1/{domain}` | List (paginated, filterable) |
| GET | `/api/v1/{domain}/:id` | Get by ID |
| POST | `/api/v1/{domain}` | Create |
| PATCH | `/api/v1/{domain}/:id` | Update |
| DELETE | `/api/v1/{domain}/:id` | Delete |
| POST | `/api/v1/{domain}/:id/{action}` | State transition |

### New API Endpoints

```
/api/v1/compliance/controls           [GET, POST]
/api/v1/compliance/controls/:id/test  [POST]
/api/v1/compliance/campaigns          [GET, POST]
/api/v1/compliance/campaigns/:id      [PATCH]

/api/v1/audits/evidence               [GET, POST] (file upload)
/api/v1/audits/access-reviews         [GET, POST]
/api/v1/audits/dormant-accounts       [GET]

/api/v1/risk/register                 [GET, POST, PATCH]
/api/v1/risk/kris                     [GET]
/api/v1/risk/kris/:id/snapshots       [GET]

/api/v1/privacy/data-inventory        [GET, POST]
/api/v1/privacy/dpia                  [GET, POST]
/api/v1/privacy/dsr                   [GET, POST, PATCH]

/api/v1/ai/copilot/query              [POST]
/api/v1/ai/agents/:id/execute         [POST]
/api/v1/ai/prompts                    [GET, POST]
/api/v1/ai/knowledge/search           [GET]

/api/v1/integrations/chronos          [GET, POST]
/api/v1/integrations/jira             [GET, POST]
/api/v1/integrations/mcp/execute      [POST]

/api/v1/notifications                 [GET, PATCH]
/api/v1/notifications/rules           [GET, POST, PATCH]

/api/v1/workflows/definitions         [GET, POST]
/api/v1/workflows/instances           [GET, POST]
/api/v1/workflows/instances/:id/transition [POST]
```

### Existing ↔ New Mapping

| Existing | New (Backwards Compat) |
|----------|------------------------|
| `/api/veg-deals` | `/api/v1/veg/deals` |
| `/api/security/vulnerabilities` | `/api/v1/security/vulnerabilities` |
| `/api/compliance` | `/api/v1/compliance` |
| `/api/audits` | `/api/v1/audits` |
| `/api/committees` | `/api/v1/committees` |
| `/api/dashboard` | `/api/v1/executive/dashboard` |

---

## 8. Integration Architecture

### Integration Layer Design

```
┌──────────────────────────────────────────────────────────────────────┐
│                        INTEGRATION LAYER                              │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                     MCP Gateway (NEW)                         │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │    │
│  │  │ Chronos  │ │   Jira   │ │  GitHub  │ │ServiceNow│        │    │
│  │  │ Adapter  │ │ Adapter  │ │ Adapter  │ │ Adapter  │        │    │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘        │    │
│  │       │             │            │             │              │    │
│  │  ┌────▼─────────────▼────────────▼─────────────▼────┐         │    │
│  │  │           MCP Protocol Layer                      │         │    │
│  │  │  - Tool registration                              │         │    │
│  │  │  - Resource exposure                              │         │    │
│  │  │  - Context management                             │         │    │
│  │  │  - Auth delegation                                │         │    │
│  │  └───────────────────────────────────────────────────┘         │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  Existing Integrations (preserve):                                    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│  │  Nexus IQ    │ │   Fortify    │ │  Veracode    │ │  SonarQube   │ │
│  │  (scheduled) │ │   (manual)   │ │   (manual)   │ │  (webhook)   │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ │
│                                                                       │
│  Infrastructure Integrations:                                         │
│  ┌──────────────┐ ┌──────────────┐                                    │
│  │   Slack      │ │    Email     │                                    │
│  │  (webhook)   │ │  (SMTP)      │                                    │
│  └──────────────┘ └──────────────┘                                    │
└──────────────────────────────────────────────────────────────────────┘
```

### New Integration Adapters

| Integration | Direction | Sync Method | Priority |
|-------------|-----------|-------------|----------|
| **Chronos** | Read + Write | REST API polling / webhook | 🔴 High |
| **Jira** | Read + Write | REST API + webhook | 🔴 High |
| **GitHub** | Read-only | REST API (webhook for PRs) | 🟡 Medium |
| **Azure DevOps** | Read-only | REST API | 🟡 Medium |
| **ServiceNow** | Read + Write | REST API + table API | 🟡 Medium |
| **Microsoft 365** | Read-only | Graph API (SharePoint, Teams) | 🟡 Medium |
| **Confluence** | Read-only | REST API | 🟢 Low |

### Integration Credential Storage

```typescript
// Replace hardcoded env vars with encrypted credential store
interface IntegrationConfig {
  provider: "chronos" | "jira" | "github" | "nexus" | "fortify" | "veracode";
  baseUrl: string;
  authType: "basic" | "token" | "oauth2" | "apikey";
  credentials: EncryptedPayload; // AES-256-GCM
  config: {
    timeout: number;
    retryCount: number;
    tlsOptions?: { rejectUnauthorized: boolean }; // Configurable, not hardcoded
  };
}
```

---

## 9. Notification Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         NOTIFICATION ENGINE                               │
│                                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Event Bus  │  │ Alert Rules │  │    Queue    │  │  Channels   │     │
│  │  Listener   │  │  Evaluator  │  │  (BullMQ)   │  │  Dispatcher │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
│         │                │                │                │             │
│  ┌──────▼────────────────▼────────────────▼────────────────▼──────┐     │
│  │                       NOTIFICATION RULES                         │     │
│  │                                                                   │     │
│  │  Rule: SLA Breach → Slack + Email + In-App Toast                 │     │
│  │  Rule: Waiver Expiring → Email to Owner                          │     │
│  │  Rule: VEG Decision Required → Slack to Committee Members        │     │
│  │  Rule: Audit Finding Overdue → Email to Auditor                  │     │
│  └───────────────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────────────┘
```

### Notification Channels

| Channel | Status | Use Case |
|---------|--------|----------|
| In-App (Toast) | ✅ Existing | Immediate alerts on current page |
| In-App (Bell) | ❌ NEW | Persistent notification center |
| Email (SMTP) | ⚠️ Queue exists, unwired | Async notifications, digests |
| Slack | ⚠️ Queue exists, unwired | Team notifications, alerts |
| WebSocket | ❌ NEW | Real-time push to browser |

---

## 10. Reporting Engine

```typescript
interface ReportTemplate {
  name: string;
  domain: string;
  sections: ReportSection[];
  format: "pdf" | "pptx" | "csv" | "xlsx";
  schedule?: CronExpression;
}

interface ReportSection {
  type: "kpi_grid" | "chart" | "table" | "narrative" | "ai_summary";
  title: string;
  dataSource: {
    api: string;
    params: Record<string, unknown>;
  };
}

// Built-in templates:
// "COMEX Monthly Pack" → PPTX: KPIs + trend charts + AI summary
// "Executive Summary" → PDF: all KPIs + KRIs + top risks
// "Audit Report" → PDF: audit detail + findings + CAPA
// "Compliance Posture" → PDF: control pass rate + breaches
```

### Report Distribution

```
Scheduled Reports:
┌──────────────┐    ┌────────────────┐    ┌─────────────────┐
│  Cron Trigger │───►│ Report Builder │───►│  Distribution   │
│  (BullMQ)    │    │ (Generate PPTX)│    │ (Email / Slack) │
└──────────────┘    └────────────────┘    └─────────────────┘

On-Demand Reports:
┌──────────────┐    ┌────────────────┐    ┌─────────────────┐
│  User Click  │───►│  API Call      │───►│  Download File  │
│  (Frontend)  │    │  (Backend)     │    │  (CSV/PDF/PPTX) │
└──────────────┘    └────────────────┘    └─────────────────┘
```

---

## 11. Security Architecture

### Current (Preserve)
- Helmet security headers
- CORS with configurable origins
- Rate limiting (100 req/window general, 10/min auth)
- JWT access tokens (1h) + refresh tokens (7d)
- bcryptjs password hashing (12 rounds)
- Input validation via Zod schemas
- Correlation ID for request tracing

### Enhancements

| Area | Current | Target |
|------|---------|--------|
| **Token Storage** | localStorage (XSS vulnerable) | HttpOnly refresh token cookie |
| **TLS** | Nexus `rejectUnauthorized: false` | Configurable TLS per environment |
| **Secrets** | Env vars + AES-256-GCM credential store | Vault / AWS Secrets Manager |
| **Audit** | Activity logs (mutations only) | Read audit trail for sensitive data |
| **Input** | Zod validation | + Request size limits, SQL injection scanner |
| **CORS** | Hardcoded localhost:5173 | Environment-configured list |
| **Rate Limiting** | Global + auth | Per-route rate limits (API keys) |
| **OWASP** | Helmet only | CSP headers, XSS protection, CSRF tokens |

---

## 12. AI Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                            AI PLATFORM                                    │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │                        AI ORCHESTRATOR                           │    │
│  ├──────────────────────────────────────────────────────────────────┤    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │    │
│  │  │  LLM     │ │  Context │ │  Tool    │ │  Response        │   │    │
│  │  │ Gateway  │ │  Builder │ │  Router  │ │  Formatter       │   │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  Copilots:                                                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │Executive │ │Compliance│ │ Security │ │  Audit   │ │   VEG    │     │
│  │ Copilot  │ │ Copilot  │ │ Copilot  │ │ Copilot  │ │ Copilot  │     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
│                                                                           │
│  AI Agents:                                                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐              │
│  │Compliance│ │ Security │ │  Audit   │ │  Reporting   │              │
│  │  Agent   │ │  Agent   │ │  Agent   │ │    Agent     │              │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘              │
│                                                                           │
│  Knowledge Layer:                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  Vector DB (pgvector)  │  Document Indexer  │  Embedding Service │    │
│  └──────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

### AI Components

| Component | Description | Implementation |
|-----------|-------------|----------------|
| **LLM Gateway** | Unified interface to LLM providers (Gemini, OpenAI, Claude) | Adapter pattern, configurable per use case |
| **Context Builder** | Assembles page context, user role, permissions, current filters | Graph of current application state |
| **Tool Router** | Routes AI requests to appropriate data sources via MCP | Function calling / tool use |
| **Copilot** | Context-aware chat assistant per domain | RAG + LLM + function calling |
| **Agent** | Autonomous task executor with objectives and memory | LLM + tool loop with state persistence |
| **Document Analyzer** | Extract insights from uploaded documents | OCR + LLM summarization |
| **RAG Pipeline** | Retrieve relevant knowledge for AI responses | pgvector embeddings + cosine similarity |

---

## 13. MCP Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    MODEL CONTEXT PROTOCOL (MCP) LAYER                     │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────────┐    │
│  │  Tool      │  │  Resource  │  │  Prompt    │  │  Context       │    │
│  │  Registry  │  │  Exposer   │  │  Templates │  │  Provider      │    │
│  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘  └───────┬────────┘    │
│         │               │               │                 │              │
│  ┌──────▼───────────────▼───────────────▼─────────────────▼──────┐     │
│  │                    MCP PROTOCOL HANDLER                         │     │
│  │  - Tool discovery: list_tools()                                │     │
│  │  - Tool execution: call_tool(name, args)                       │     │
│  │  - Resource access: read_resource(uri)                         │     │
│  │  - Prompt templates: get_prompt(name, args)                    │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                           │
│  Exposed Tools:                                                            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │get_vulns     │ │get_veg_deals │ │get_compliance│ │get_audits    │  │
│  │(Security)    │ │(VEG)         │ │(Compliance)  │ │(Audit)       │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │get_kpis      │ │create_report │ │schedule_audit│ │get_risk_data │  │
│  │(Executive)   │ │(Reporting)   │ │(Audit)       │ │(Risk)        │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │
│                                                                           │
│  Integration Adapters (each exposed as MCP tools):                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │ Chronos      │ │ Jira         │ │ GitHub       │ │ ServiceNow   │  │
│  │ Adapter      │ │ Adapter      │ │ Adapter      │ │ Adapter      │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 14. Knowledge Base Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         KNOWLEDGE BASE                                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Content Sources:                                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │  Governance  │ │   Policies  │ │    Standards │ │  Procedures  │   │
│  │  (manual)    │ │  (manual)   │ │   (manual)   │ │  (manual)    │   │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │  Regulations │ │  Audit       │ │  Meeting     │ │  Contracts   │   │
│  │  (imported)  │ │  Templates   │ │  Minutes     │ │  (uploaded)  │   │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘   │
│                                                                           │
│  Indexing Pipeline:                                                       │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────────────┐  │
│  │ Document │───►│ Chunking │───►│Embedding │───►│ pgvector Store   │  │
│  │ Parser   │    │          │    │ (LLM)    │    │ (cosine search)  │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────────────┘  │
│                                                                           │
│  Query Pipeline (RAG):                                                    │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────────────┐  │
│  │  User    │───►│Embedding │───►│Similarity│───►│ LLM + Context    │  │
│  │  Query   │    │ Vector   │    │  Search  │    │  → Response      │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 15. Event & Worker Architecture

### BullMQ Queues (Extended)

| Queue | Worker | Schedule | Status |
|-------|--------|----------|--------|
| `nexus-sync` | Full Nexus IQ sync | Every 12h (10:00, 13:00) | ✅ Existing |
| `sla-breach` | Detect SLA breaches | On demand + hourly | ✅ Existing |
| `waiver-expiry` | Check waiver expiration | Daily | ✅ Existing |
| `email-notify` | Send emails | On demand | ⚠️ Queue exists, unwired |
| `kpi-recalc` | Recalculate all KPIs | Every 15min | ⚠️ Queue exists, unwired |
| `enrichment` | EPSS + CISA KEV enrichment | On demand | ✅ Existing |
| `veg-sla-check` | VEG SLA monitoring | Every 6h | ✅ Existing |
| `report-generate` | Generate scheduled reports | Per cron config | ❌ NEW |
| `chronos-sync` | Sync projects from Chronos | Hourly | ❌ NEW |
| `jira-sync` | Sync issues from Jira | Hourly | ❌ NEW |
| `notification-dispatch` | Dispatch pending notifications | Continuous | ❌ NEW |
| `dormant-account-scan` | Detect dormant accounts | Daily | ❌ NEW |

---

## 16. Migration Strategy (Existing → Target)

### Incremental, Non-Breaking

| Step | What | Risk | Duration |
|------|------|------|----------|
| **1** | Add new tables via migrations (non-breaking) | None | 1-2 days |
| **2** | Add new routes/services alongside existing | Low | 3-5 days |
| **3** | Extract shared base classes (CrudRepository, useCrud) | Medium | 3-5 days |
| **4** | Decompose monolithic workspace pages into feature components | Medium | 5-7 days |
| **5** | Decompose VEG monolith (1200 lines) | High | 5-7 days |
| **6** | Add global search + command palette | Medium | 3-5 days |
| **7** | Add notification center + WebSocket | Medium | 5-7 days |
| **8** | OpenAPI code generation (shared types) | Medium | 5-7 days |
| **9** | Add new dashboards (Security, Compliance, Risk) | Low | 3-5 days each |
| **10** | Add AI copilot + chat | Medium | 5-7 days |
| **11** | Add Chronicle + Jira integrations | Medium | 5-7 days each |
| **12** | Extract workflow engine | High | 7-10 days |
| **13** | Add MCP layer | Medium | 5-7 days |
| **14** | Add RAG knowledge base | Medium | 5-7 days |
| **15** | Production hardening (K8s, IaC, full test coverage) | Medium | 10-14 days |

---

## Architecture Decision Records

### ADR-001: Backend Routes Grouped by Domain

**Context:** 26 route files in flat `routes/` with mixed naming conventions (veg.routes.ts vs unifiedFinding.routes.ts).

**Decision:** Group routes by bounded context in subdirectories: `routes/veg/`, `routes/security/`, `routes/compliance/`, etc. Existing routes get adapter wrappers for backwards compatibility.

**Consequence:** Cleaner organization. All routes within a domain can share validation, middleware, and error handling.

### ADR-002: OpenAPI Code Generation for Shared Types

**Context:** Types are manually duplicated across frontend and backend with no automated sync.

**Decision:** Generate TypeScript types from OpenAPI schema via `openapi-typescript`. Backend is the source of truth for types. Frontend imports from `generated/api.d.ts`.

**Consequence:** Single source of truth for all DTOs. Type mismatches become compile-time errors instead of runtime crashes.

### ADR-003: MCP as Integration Abstraction Layer

**Context:** New integrations (Chronos, Jira, GitHub) need to be usable by both business logic services and AI agents.

**Decision:** Build an MCP layer that wraps each integration as a standard tool. Business logic services call integrations through MCP. AI agents discover and call the same tools.

**Consequence:** Every integration is immediately available to both human workflows and AI agents. New integrations automatically become AI-accessible.

### ADR-004: Monorepo with Shared Package

**Context:** current monorepo has no shared package — types and validation are duplicated.

**Decision:** Create `shared/` directory at root level with pure TypeScript types and Zod schemas. Both `frontend/` and `backend/` import from `shared/` via path aliases.

**Consequence:** Type consistency. Validation schemas (Zod) can be shared for client-side and server-side validation.

### ADR-005: Decompose Monolithic Pages via Feature Slices

**Context:** Workspace pages handle multiple modes (list/detail/create/edit) in single files of 400-1200 lines.

**Decision:** Split each workspace into feature-based page components (e.g., `VegDealList.tsx`, `VegDealDetail.tsx`, `VegDealForm.tsx`). The workspace orchestrator becomes a thin router component.

**Consequence:** Components become testable, independently loadable, and easier to maintain. Dead code elimination becomes straightforward.
