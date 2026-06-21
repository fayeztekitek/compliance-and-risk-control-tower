# Compliance & Risk Control Tower — Analysis

## Business Case

A centralized governance platform for **VERMEG** (fintech/insurance software company) to unify compliance, risk, and control management across security vulnerabilities, deal governance, project delivery risk, SaaS lifecycle, GDPR privacy, audits, and contractual obligations — replacing siloed spreadsheets and manual processes with a single "control tower" dashboard for executives, compliance officers, risk managers, security managers, product owners, and auditors.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite 6, Tailwind CSS 4 |
| **Backend** | Express 4, tsx (TypeScript execution) |
| **Visualization** | Recharts (bar/area/pie charts) |
| **Animation** | Motion (Framer Motion) |
| **Icons** | Lucide React |
| **AI** | Google Gemini (`@google/genai`) |
| **Storage** | LocalStorage (browser) + in-memory mock server |
| **Database (schema only)** | PostgreSQL / Cloud SQL (`nexus_schema.sql`) |
| **Import/Export** | XLSX (Excel/CSV) |

## Architecture Overview

```
project-root/
├── server.ts                  # Express backend (Nexus IQ API proxy + mock data)
├── index.html                 # SPA entry
├── vite.config.ts             # Vite config (dev server, proxy)
├── src/
│   ├── main.tsx               # React entry
│   ├── App.tsx                # Routing, RBAC, layout
│   ├── types.ts               # Core domain types (User, VEGRequest, Vulnerability, etc.)
│   ├── nexusTypes.ts          # Nexus IQ types + SQL schema interfaces
│   ├── mockData.ts            # Mock data for all core entities
│   ├── nexusMockData.ts       # Mock data for Nexus IQ entities
│   ├── nexusApiClient.ts      # Nexus IQ REST API client (retry, logging)
│   ├── realVegRequests.ts     # 70+ real-world VEG deal records
│   ├── store/
│   │   └── complianceStore.ts # Central state (CRUD, RBAC, metrics engine, 16 KPIs)
│   ├── components/
│   │   ├── ExecutiveDashboard.tsx
│   │   ├── VegGovernanceWorkspace.tsx
│   │   ├── SecurityGovernanceWorkspace.tsx
│   │   ├── NexusWorkspace.tsx
│   │   ├── RoadmapProjectWorkspace.tsx
│   │   ├── SaaSGovernanceWorkspace.tsx
│   │   ├── AuditsContractsWorkspace.tsx
│   │   ├── CommitteesWorkspace.tsx
│   │   ├── AdministrationWorkspace.tsx
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
```

## Main Features

### 1. Executive Dashboard
- KPI card grid — 15 real-time KPIs across 4 categories (SECURITY, COMPLIANCE, DELIVERY, SAAS_PRIVACY)
- 5×5 SLA Operational Risk Matrix — interactive heatmap (Severity × Likelihood) with drill-down
- Critical Exposures Registry — top critical/high vulnerabilities
- "Yesterday's Pending Items" — chronological deal/waiver/audit summary
- Scanner Suite bar chart — vulnerabilities by scanner (Veracode, Nexpose, PenTest)
- Chronos RTD area chart — project RTD values and slippage over time
- KRI Financial Breach Limits — breach cost, SLA exceeded, budget slippage, non-compliant SaaS
- Upcoming Committees — scheduled steering committee meetings

### 2. VEG & Deal Governance
- VEG (Vermeg Engagement Governance) request pipeline with status tracking
- Bid/No-Bid & Go/No-Go decision workflow
- Multi-departmental sign-off tracking (Finance, Sales, Product, Legal)
- Excel/CRM spreadsheet sync — compare real CRM data with local state, batch updates
- New VEG request creation form
- 70+ real-world deal records (from 2023)
- Pagination, search, and detail side panel

### 3. Security & Vulnerability Governance
- Vulnerability registry — CRUD for security findings (severity, status, scanner source, SLA)
- Security scan import — parse Excel scans (Veracode, SonarQube, Fortify, Nexus IQ)
- False positive management — mark with technical explanation
- Waiver management — request, approve, track with expiration monitoring
- Risk acceptance — formal process with business impact and mitigation plan
- SLA breach tracking — overdue enforcement
- DevOps-Sec portal sync — external synchronization endpoint
- Scan insights panel — visual breakdown by scanner

### 4. Sonatype Nexus IQ Connector
- **Executive KPI Dashboard** — global risk score, vulnerability breakdown, product heatmap, trend history
- **Product-Level Drill-Down** — per-product risk score, severity counts, security debt, compliance %, MTTR, fix velocity
- **Vulnerability Explorer** — searchable/filterable CVE list with severity, status, reachability
- **Waiver Management** — create/view waivers with approval workflow
- **Technical Debt Analysis** — component-level remediation tracking
- **Connection Settings** — Nexus IQ server URL, auth, timeout, retry configuration
- **Connection Probe** — test connectivity
- **Synchronization Engine** — full sync cycle with progress, delta tracking, audit logging
- **Export** — CSV and text-based audit report
- **Integration Tests** — 9 categories (UNIT, INTEGRATION, API, MOCK_SERVER, SECURITY, PERFORMANCE, PAGINATION, API_ERROR, TIMEOUT)

### 5. Roadmaps & Projects
- 8 active projects with status (ON_TRACK, DEVIATING, HIGH_RISK)
- 5 roadmaps (strategic, budgetary, regulatory) with progress and milestone status
- RTD (Remaining To Do) monthly declaration with deviation/slippage calculation
- Go-live readiness assessment (READY, RISKY, BLOCKED)

### 6. SaaS Governance & Privacy
- SaaS application registry with lifecycle stage tracking
- Go-live readiness scoring with checklist
- Privacy by Design review — GDPR compliance checks
- Data processing inventory — data classification and storage mapping
- 5-point GDPR compliance checklist

### 7. Audits & Contractual Obligations
- **CAPA Center** — 20 corrective/preventive actions (NOT_STARTED, IN_PROGRESS, COMPLETED, OVERDUE)
- **Audit Findings** — 15 findings across 4 audits with categorization
- **Contractual Obligations** — 10 obligations linked to client contracts with compliance status
- **Evidence & Closure** — completion tracking with evidence descriptions

### 8. Committees & Assembly
- 5 committees (VEG, Vulnerability, SaaS Steering, Executive Security, Executive Arbitration)
- Agenda management — add topics to upcoming meetings
- Minutes & decisions — record outcomes with status (APPROVED/REJECTED/DEFERRED)
- Status tracking — PLANNED, HELD, CANCELLED

### 9. Administration & RBAC
- **7 user roles**: ADMIN, COMPLIANCE_OFFICER, RISK_MANAGER, SECURITY_MANAGER, PRODUCT_OWNER, AUDITOR, EXECUTIVE_READ_ONLY
- Permission-based navigation — menu items and workspaces restricted by role
- Persona switcher — dynamic role switching for testing
- Audit trail viewer — complete action log with search/filter
- User management — 7 predefined personas
- Cache reset — factory default restore

### 10. Risk Score Engine
8-factor weighted model producing a 0–100 product risk score:

| Factor | Weight | Details |
|--------|--------|---------|
| CVSS Score | ×4 (max 40) | Base CVSS score |
| Severity | 15/10/5/2 | CRITICAL / HIGH / MEDIUM / LOW |
| Reachability | 15/5/0 | REACHABLE / UNKNOWN / NOT_REACHABLE |
| Exploitability | 10/6/3/0 | EASY / MEDIUM / HARD / THEORETICAL |
| Age | 10/5/2 | >90 days / >30 days / <30 days |
| Business Criticality | 10/7/4/1 | CRITICAL / HIGH / MEDIUM / LOW |
| Waiver Penalty | −15 waived / −10 accepted | Reduces score |
| Fix Available | +10 | Penalty if fix exists but not applied |

## Primary Use Cases

1. **Executive Oversight** — C-level monitors compliance posture via dashboard
2. **Security Operations** — Security managers track vulnerabilities, waivers, risk acceptances
3. **Compliance Management** — Compliance officers monitor contractual obligations, audits, regulations
4. **Deal Governance** — Sales/finance manage VEG process for new engagements
5. **Project Portfolio Management** — Product owners track delivery risk (RTD) and roadmap milestones
6. **SaaS Lifecycle Governance** — Manage SaaS through onboarding → go-live → offboarding
7. **Audit Management** — Auditors track findings, CAPAs, evidence
8. **Software Supply Chain Security** — Nexus IQ integration for OSS vulnerability management

## Data Models

### Core Domain Entities (`src/types.ts`)

| Entity | Key Fields |
|--------|-----------|
| **User** | id, name, email, role, status |
| **RoleConfig** | role, label, permissions[] |
| **Committee** | id, name, date, type, status, participants, agenda[], decisions[] |
| **VEGRequest** | id, title, type, client, marginEstimate, workloadMD, sign-off states, decisions |
| **Vulnerability** | id, title, severity, status, scanner, slaDueDate, targetProduct, owner |
| **Waiver** | id, vulnerabilityId, rationale, status, expiryDate |
| **RiskAcceptance** | id, vulnerabilityId, businessImpact, mitigationPlan, status, expiryDate |
| **Project** | id, name, budget, rtdValue, rtdDeviation, slippageMD, status |
| **SaaSApplication** | id, name, lifecycleStage, goLiveReadiness, gdprRiskImpact |
| **Audit** | id, title, type, date, status, leadAuditor |
| **AuditFinding** | id, title, severity, status, targetEntity |
| **CorrectiveAction** | id, description, owner, dueDate, status |
| **ContractualObligation** | id, title, requirement, frequency, status, verifiedBy |
| **KPI/KRI** | id, name, value, target, trend, category |
| **AuditTrail** | id, timestamp, user, role, action, module, status |

### Nexus IQ Entities (`src/nexusTypes.ts`)

| Entity | Key Fields |
|--------|-----------|
| **NexusProduct** | product_id, name, status (RED/ORANGE/GREEN), business_criticality |
| **NexusApplication** | applicationId, organizationId, tags, businessCriticality |
| **NexusVulnerability** | vulnerabilityId (CVE), cvssScore, severity, component, reachable, fixAvailable, exploitability, status |
| **NexusPolicyViolation** | violationId, policyName, threatLevel, waiverStatus |
| **NexusWaiver** | waiverId, reason, approver, expirationDate, status |
| **NexusKPISnapshot** | globalSecurityRiskScore, totalVulnerabilities, complianceScore |
| **NexusSyncLog** | batchId, startTime, endTime, status, summary |
