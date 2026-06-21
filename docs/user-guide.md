# Compliance & Risk Control Tower — User Guide

## Overview

The Compliance & Risk Control Tower is a centralized governance platform for managing compliance, risk, security, vendor governance, project delivery, and executive oversight. It replaces siloed spreadsheets and manual processes with a unified dashboard and workflow system.

---

## Roles & Access

Seven hierarchical roles control what each user can see and do:

| Role | Level | Description |
|------|-------|-------------|
| ADMIN | 100 | Full system access, user management, configuration |
| COMPLIANCE_OFFICER | 80 | Compliance oversight, audit management, contractual obligations |
| RISK_MANAGER | 70 | Risk assessment, project deviation tracking, KRI monitoring |
| SECURITY_MANAGER | 60 | Vulnerability management, waivers, risk acceptances, SLA |
| PRODUCT_OWNER | 50 | Project roadmaps, SaaS lifecycle, VEG requests |
| AUDITOR | 40 | Read access to audits, findings, CAPAs, vulnerabilities |
| EXECUTIVE_READ_ONLY | 30 | Dashboard-only access with executive KPIs |

Higher-ranked roles inherit all permissions from lower-ranked roles.

---

## Getting Started

### Logging In

1. Navigate to the application URL
2. Enter your email and password
3. Click **Sign in**

Default test credentials:

| Role | Email | Password |
|------|-------|----------|
| ADMIN | fayez.tekitek@vermeg.com | admin123! |
| COMPLIANCE_OFFICER | amandine.rousset@vermeg.com | compliance123! |
| RISK_MANAGER | m.dubois@vermeg.com | risk123! |
| SECURITY_MANAGER | t.lemaire@vermeg.com | security123! |
| PRODUCT_OWNER | s.laroche@vermeg.com | product123! |
| AUDITOR | j.mercer@vermeg.com | auditor123! |
| EXECUTIVE_READ_ONLY | jp.v@vermeg.com | exec123! |

### Navigation

The sidebar on the left shows your available workspaces based on your role:

- **Dashboard** — Executive KPI overview (all roles)
- **VEG Governance** — Vendor engagement requests (VEG)
- **Security** — Vulnerabilities, waivers, risk acceptances
- **Nexus IQ** — Software supply chain risk scoring
- **Roadmaps** — Project roadmaps and delivery tracking
- **SaaS Governance** — SaaS lifecycle management
- **Audits** — Audit findings, CAPAs, contractual obligations
- **Committees** — Committee management and decisions
- **Administration** — System configuration (admin only)

---

## Executive Dashboard

The Dashboard provides a real-time snapshot of your governance posture.

### KPI Cards
16 key performance indicators displayed in a card grid:

**Security:**
- Total Vulnerabilities, Critical, High, Open, SLA Overdue
- False Positives, Fixed, Waived, Active Waivers

**Delivery:**
- Total Projects, Deviating Projects, Budget Overruns

**Risk:**
- Global Risk Score (%), Compliance Score (%), Security Debt (%)

**Products:**
- Red Products (high risk), Green Products (low risk)

### Key Risk Indicators (KRIs)
Four threshold-based indicators with visual progress bars:

| KRI | Threshold | Unit |
|-----|-----------|------|
| Breach Cost Exposure | €500,000 | EUR |
| SLA Exceeded Vulnerabilities | 10 | count |
| Budget Overrun Projects | 3 | count |
| Non-Compliant SaaS | 2 | count |

Each KRI shows **OK** (green), **WARNING** (amber), or **BREACHED** (red) status.

### 5x5 Risk Heatmap
A matrix mapping vulnerability severity (CRITICAL → LOW) against age ranges (0–7d → 180+d). Cell intensity reflects the number of vulnerabilities in that bucket.

### Monthly Trends
- **Risk Score** line chart — tracks global security risk score over time
- **Vulnerabilities** stacked bar chart — critical vs high by month
- **Project Trends** — total projects vs deviating projects by month

### Export
Click **CSV** or **PDF** in the dashboard header to download KPI data.

---

## VEG Governance

VEG (Vendor/Engagement Governance) manages the lifecycle of client engagement requests.

### List View
- Search by title or client
- Filter by status (DRAFT, SUBMITTED, APPROVED, REJECTED, CONTRACT_SIGNATURE)
- Filter by type (RFI, RFP, NEW_CLIENT_REQUEST, BD_REQUEST, ACC_CODE_CREATION, BID_COMMITTEE_OVERSIGHT)
- Paginated table with sortable columns

### Creating a VEG Request
1. Click **New VEG Request**
2. Fill in title, type, client, margin estimate, workload (man-days), and ACC code
3. Click **Create Request**

### Detail View
Click any row to see full details:

- **Department Sign-Offs** — Approve/reject from Finance, Sales, Product, Legal (all four must approve for auto-approval)
- **Bid Decision** — Bid or No Bid
- **Go/No-Go Decision** — Go or No Go
- **Opportunities** — Add opportunities with value and sales stage
- **Contracts** — Add contracts with start/end dates and SLA commitments

---

## Security Governance

### Vulnerability Registry
- Search by title
- Filter by severity (CRITICAL, HIGH, MEDIUM, LOW) and status (OPEN, FALSE_POSITIVE, WAIVED, REMEDIATED)
- SLA overdue items are highlighted in red

### Actions
- **Create Vulnerability** — Manual entry with title, severity, scanner, SLA due date, product, owner
- **Mark as False Positive** — Provide technical explanation (min 10 chars)
- **View Details** — See full vulnerability information

### Import Scan
Paste a JSON array of vulnerabilities (from Veracode, Nexpose, or Pen Test reports) to bulk-import them.

### Waivers
Request security waivers with rationale and expiry date. Approve or reject pending waivers.

### Risk Acceptances
Formal risk acceptance process with business impact and mitigation plan. Approve pending acceptances.

### SLA Incidents
Dashboard showing total, breached, and open SLA incidents with a detailed table.

---

## Nexus IQ Connector

Integrates with Sonatype Nexus IQ for software supply chain vulnerability management.

- **Products** — View products with risk status (RED/ORANGE/GREEN)
- **Risk Scores** — 8-factor weighted calculation (CVSS, severity, reachability, exploitability, age, business criticality, waiver penalty, fix availability)
- **Configuration** — Set Nexus IQ server URL, credentials, and test connectivity
- **Synchronization** — Trigger manual sync, view sync logs and status
- **Executive KPIs** — Global risk score, vulnerability trends
- **Export** — CSV and PDF reports

---

## Projects & Roadmaps

### Projects
Track project status (ON_TRACK, DEVIATING, HIGH_RISK), budgets, and consumption.

### RTD (Remaining To Do)
Monthly declarations with deviation/slippage calculation for delivery risk monitoring.

### Go-Live Readiness
Assess go-live readiness with status: READY, RISKY, or BLOCKED.

---

## SaaS Governance

Lifecycle management for SaaS applications:

- **Lifecycle Stages** — Onboarding, Active, Under Review, Offboarding
- **Go-Live Readiness** — Scoring with checklist
- **Privacy by Design** — GDPR compliance checks
- **Data Processing Inventory** — Data classification and storage mapping

---

## Audits & Contracts

### Audit Findings
Track findings across audits with severity, status, and target entity.

### CAPA (Corrective & Preventive Actions)
Manage corrective actions with owner, due date, and status tracking (NOT_STARTED, IN_PROGRESS, COMPLETED, OVERDUE).

### Contractual Obligations
Monitor obligations linked to client contracts with compliance status and verification.

---

## Committees

- **Committee Types** — VEG, Vulnerability, SaaS Steering, Executive Security, Executive Arbitration
- **Agenda Management** — Add topics to upcoming meetings
- **Minutes & Decisions** — Record outcomes with APPROVED/REJECTED/DEFERRED status
- **Status Tracking** — PLANNED, HELD, CANCELLED

---

## Need Help?

- API documentation is available at `/api/docs` when the server is running
- For technical issues, refer to the [Installation Guide](./installation.md)
- For architecture details, see the [Design Document](./design.md)
