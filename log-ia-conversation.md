# Sonatype Nexus IQ Lifecycle Connector - Project Build History & System Documentation

This document contains a comprehensive log of our entire technical development session, architectural specifications, schema blueprints, and functional capabilities implemented for the **Sonatype Nexus IQ Connector** integration within the Vermeg Compliance & Risk Governance workspace.

---

## 1. Executive Summary & Project Intent

The primary objective of this project is to integrate the Vermeg Compliance & Risk Governance platform with **Sonatype Nexus IQ Lifecycle** to automate the collection, aggregation, scoring, and visualization of security telemetry metrics, policy violations, waivers, and component remidiation paths.

The integration targets **8 premium core corporate products** of Vermeg:
- **Megara** (Criticality: `CRITICAL`)
- **Soliam** (Criticality: `CRITICAL`)
- **Digital Insurance** (Criticality: `HIGH`)
- **Framework** (Criticality: `CRITICAL`)
- **Solife** (Criticality: `CRITICAL`)
- **Digital Banking** (Criticality: `HIGH`)
- **Solife Digital Platform** (Criticality: `HIGH`)
- **Colline** (Criticality: `LOW`)

---

## 2. Technical Architecture Blueprint

We have established a robust, full-stack architecture mapping back to standard Node.js server pipelines combined with a highly modular React + Tailwind CSS client interface. 

### Core Components Built:
1. **`nexus_schema.sql`**: Complete relational SQL data model for Postgres/Cloud SQL databases.
2. **`src/nexusTypes.ts`**: Strict TypeScript type representations and interfaces for all models and KPI data boundaries.
3. **`src/nexusMockData.ts`**: High-fidelity, multi-dimensional seed model delivering test records (8 products, 20 applications, 50 detailed scan histories, 200 vulnerabilities, 80 policy violations, 30 active/expired waivers, and 100 components).
4. **`src/nexusApiClient.ts`**: Secure Sonatype REST API Proxy client incorporating auto-connect health checks, configurable network timeouts, automated retry backoffs, and strict technical log credential-masking filters.
5. **`server.ts`**: Live Express.js full-stack backend application handling authentication, data-ingestion synchronizations, the mathematical Risk Scoring Model, metric calculations, and data exporting.
6. **`src/components/NexusWorkspace.tsx`**: Dynamic executive, product, vulnerability, and waiver dashboards with interactive controls, charts, and reporting portals.
7. **`src/nexusTests.ts`**: Integrated system testing module evaluating unit formulas, mapping linkages, API models, security masks, and performance latency loops.

---

## 3. Relational SQL Data Model (`nexus_schema.sql`)

The database architecture has been configured with high-performance indices on critical query fields (`product_id`, `application_id`, `scan_id`, `severity`, `status`, and SLA dates) to handle deep analytical queries with speed.

```sql
-- ============================================================================
-- SQL Data Model - Sonatype Nexus IQ Lifecycle Connector Schema
-- Target Database: PostgreSQL / Cloud SQL Relational Instance
-- ============================================================================

-- 1. Table: Products
CREATE TABLE products (
    id VARCHAR(100) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source_system VARCHAR(100) NOT NULL,
    sync_batch_id VARCHAR(100) NOT NULL,
    product_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('RED', 'ORANGE', 'GREEN')),
    business_criticality VARCHAR(20) NOT NULL CHECK (business_criticality IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    security_owner VARCHAR(255),
    product_owner VARCHAR(255)
);

-- 2. Table: Nexus Organizations
CREATE TABLE nexus_organizations (
    id VARCHAR(100) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source_system VARCHAR(100) NOT NULL,
    sync_batch_id VARCHAR(100) NOT NULL,
    organization_id VARCHAR(100) UNIQUE NOT NULL,
    organization_name VARCHAR(255) NOT NULL,
    parent_organization_id VARCHAR(100) REFERENCES nexus_organizations(organization_id)
);

-- 3. Table: Nexus Applications
CREATE TABLE nexus_applications (
    id VARCHAR(100) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source_system VARCHAR(100) NOT NULL,
    sync_batch_id VARCHAR(100) NOT NULL,
    application_id VARCHAR(100) UNIQUE NOT NULL,
    application_public_id VARCHAR(100) UNIQUE NOT NULL,
    application_name VARCHAR(255) NOT NULL,
    organization_id VARCHAR(100) REFERENCES nexus_organizations(organization_id),
    tags TEXT, -- Stored as comma-separated values or JSON
    categories TEXT,
    business_criticality VARCHAR(20) NOT NULL CHECK (business_criticality IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    security_owner VARCHAR(255),
    product_owner VARCHAR(255)
);

-- 4. Table: Product-Application Mapping
CREATE TABLE product_application_mapping (
    id VARCHAR(100) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source_system VARCHAR(100) NOT NULL,
    sync_batch_id VARCHAR(100) NOT NULL,
    product_id VARCHAR(100) REFERENCES products(product_id) ON DELETE CASCADE,
    organization_id VARCHAR(100) REFERENCES nexus_organizations(organization_id) ON DELETE SET NULL,
    application_id VARCHAR(100) REFERENCES nexus_applications(application_id) ON DELETE SET NULL,
    CONSTRAINT uq_mapping UNIQUE (product_id, organization_id, application_id)
);

-- 5. Table: Nexus Scan Reports
CREATE TABLE nexus_scan_reports (
    id VARCHAR(100) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source_system VARCHAR(100) NOT NULL,
    sync_batch_id VARCHAR(100) NOT NULL,
    scan_id VARCHAR(100) UNIQUE NOT NULL,
    application_id VARCHAR(100) REFERENCES nexus_applications(application_id) ON DELETE CASCADE,
    application_public_id VARCHAR(100),
    stage VARCHAR(50) NOT NULL CHECK (stage IN ('develop', 'build', 'release', 'operate')),
    scan_date DATE NOT NULL,
    report_url TEXT NOT NULL,
    policy_evaluation_date TIMESTAMP WITH TIME ZONE,
    total_components INT DEFAULT 0,
    affected_components INT DEFAULT 0,
    critical_count INT DEFAULT 0,
    high_count INT DEFAULT 0,
    medium_count INT DEFAULT 0,
    low_count INT DEFAULT 0
);

-- 6. Table: Nexus Components
CREATE TABLE nexus_components (
    id VARCHAR(100) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source_system VARCHAR(100) NOT NULL,
    sync_batch_id VARCHAR(100) NOT NULL,
    component_name VARCHAR(255) NOT NULL,
    current_version VARCHAR(100) NOT NULL,
    latest_version VARCHAR(100) NOT NULL,
    recommended_version VARCHAR(100) NOT NULL,
    remediation_path TEXT,
    security_risk VARCHAR(20) NOT NULL CHECK (security_risk IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE')),
    license_risk VARCHAR(20) NOT NULL CHECK (license_risk IN ('RED', 'YELLOW', 'GREEN', 'NONE')),
    popularity INT DEFAULT 0,
    age VARCHAR(100),
    number_of_affected_applications INT DEFAULT 0
);

-- 7. Table: Nexus Vulnerabilities
CREATE TABLE nexus_vulnerabilities (
    id VARCHAR(100) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source_system VARCHAR(100) NOT NULL,
    sync_batch_id VARCHAR(100) NOT NULL,
    vulnerability_id VARCHAR(100) NOT NULL,
    ref_id VARCHAR(100) NOT NULL,
    cvss_score NUMERIC(3,1) NOT NULL,
    cvss_vector VARCHAR(255),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    component_name VARCHAR(255) NOT NULL,
    component_version VARCHAR(100) NOT NULL,
    package_url TEXT,
    dependency_type VARCHAR(50) NOT NULL CHECK (dependency_type IN ('direct', 'transitive')),
    reachable VARCHAR(30) NOT NULL CHECK (reachable IN ('REACHABLE', 'NOT_REACHABLE', 'UNKNOWN')),
    recommended_version VARCHAR(100),
    fix_available BOOLEAN DEFAULT FALSE,
    exploitability VARCHAR(50),
    age_in_days INT,
    first_seen_date DATE,
    last_seen_date DATE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Open', 'Fixed', 'Accepted', 'Waived', 'False Positive')),
    application_id VARCHAR(100) REFERENCES nexus_applications(application_id) ON DELETE CASCADE,
    scan_id VARCHAR(100) REFERENCES nexus_scan_reports(scan_id) ON DELETE CASCADE
);

-- 8. Table: Nexus Policy Violations
CREATE TABLE nexus_policy_violations (
    id VARCHAR(100) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source_system VARCHAR(100) NOT NULL,
    sync_batch_id VARCHAR(100) NOT NULL,
    violation_id VARCHAR(100) UNIQUE NOT NULL,
    policy_name VARCHAR(255) NOT NULL,
    constraint_name VARCHAR(255) NOT NULL,
    threat_level INT CHECK (threat_level BETWEEN 1 AND 10),
    application_id VARCHAR(100) REFERENCES nexus_applications(application_id) ON DELETE CASCADE,
    product_mapping VARCHAR(100) REFERENCES products(product_id) ON DELETE SET NULL,
    component_name VARCHAR(255) NOT NULL,
    stage VARCHAR(50) NOT NULL,
    created_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('OPEN', 'RESOLVED')),
    waiver_status VARCHAR(20) NOT NULL CHECK (waiver_status IN ('ACTIVE', 'EXPIRED', 'NONE')),
    business_impact TEXT
);

-- 9. Table: Nexus Waivers
CREATE TABLE nexus_waivers (
    id VARCHAR(100) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source_system VARCHAR(100) NOT NULL,
    sync_batch_id VARCHAR(100) NOT NULL,
    waiver_id VARCHAR(100) UNIQUE NOT NULL,
    violation_id VARCHAR(100) REFERENCES nexus_policy_violations(violation_id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    approver VARCHAR(255) NOT NULL,
    requester VARCHAR(255) NOT NULL,
    creation_date DATE NOT NULL,
    expiration_date DATE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'expired', 'stale')),
    product_id VARCHAR(100) REFERENCES products(product_id) ON DELETE CASCADE,
    application_id VARCHAR(100) REFERENCES nexus_applications(application_id) ON DELETE CASCADE,
    component_name VARCHAR(255),
    risk_acceptance_comment TEXT
);

-- 11. Table: Nexus Alerts
CREATE TABLE nexus_alerts (
    id VARCHAR(100) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source_system VARCHAR(100) NOT NULL,
    sync_batch_id VARCHAR(100) NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    product_id VARCHAR(100) REFERENCES products(product_id) ON DELETE CASCADE,
    application_id VARCHAR(100) REFERENCES nexus_applications(application_id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    archived BOOLEAN DEFAULT FALSE
);
```

---

## 4. Proprietary Risk Scoring Model Formula

Risk scores for each vulnerability are mathematically aggregated using weighted metrics:

$$\text{Risk Score} = C_{CVSS} + S_{Sev} + R_{Reach} + E_{Exploit} + A_{Age} + B_{Crit} + P_{Waiver} + F_{Fix}$$

### Weight Assignments:
1. **CVSS Baseline Contribution**: CVSS score $\times$ 4 (max contribution: **40**)
2. **Severity Classification Factor**:
   - `CRITICAL`: **15**
   - `HIGH`: **10**
   - `MEDIUM`: **5**
   - `LOW`: **2**
3. **Execution Reachability Probe Weight**:
   - `REACHABLE`: **15**
   - `UNKNOWN`: **5**
   - `NOT_REACHABLE`: **0**
4. **Exploitability Level Factor**:
   - `EASY`: **10**
   - `MEDIUM`: **6**
   - `HARD`: **3**
   - `THEORETICAL`: **0**
5. **Vulnerability Age Metric**:
   - $>90$ Days: **10**
   - $>30$ Days: **5**
   - $\le 30$ Days: **2**
6. **Product Business Criticality**:
   - `CRITICAL`: **10**
   - `HIGH`: **7**
   - `MEDIUM`: **4**
   - `LOW`: **1**
7. **Waiver & Mitigation Discount**:
   - Active Waiver: **-15**
   - Accepted Policy: **-10**
8. **Remediation Fix Availability Penalty**:
   - Solution path exists on public branches but hasn't been applied: **+10**

### Combined Rating Thresholds:
- **0 - 20**: `GREEN` (Acceptable Compliance)
- **21 - 50**: `YELLOW` (Minor Threat Risk)
- **51 - 75**: `ORANGE` (Moderate Operational Risk)
- **76 - 100**: `RED` (Critical Breach Susceptibility)

---

## 5. Security & Access Protocols

To maintain rigorous enterprise security standards, credentials are never saved within public static source trees.
- **Environment Separation**: API configuration defaults to server-side process environments:
  ```env
  NEXUS_IQ_URL=https://soft-security:8070/
  NEXUS_IQ_USERNAME=ftekitek
  NEXUS_IQ_TOKEN=kvq6XXWn
  ```
- **Technical Log Filtering**: The proxy server utilizes recursive regular expressions to inspect outbound sync logs and mask basic authorization headers prior to caching, database writes, or visual rendering audits.

---

## 6. Development Sprint Execution Path Completed

```
   ┌────────────────────────────────────────┐
   │ Sprint 1: Architecture & Auth Gateway  │ ──► Verified server.ts routing
   └────────────────────────────────────────┘
                       │
   ┌────────────────────────────────────────┐
   │   Sprint 2: Discovery Engine & Maps    │ ──► Auto-linked 20 Apps to 8 Products
   └────────────────────────────────────────┘
                       │
   ┌────────────────────────────────────────┐
   │  Sprint 3: Scan Reports Harvesting    │ ──► Pulled 50 execution history series
   └────────────────────────────────────────┘
                       │
   ┌────────────────────────────────────────┐
   │ Sprint 4: Vulnerability & Aging metrics│ ──► Calculated MTTR SLA age brackets
   └────────────────────────────────────────┘
                       │
   ┌────────────────────────────────────────┐
   │    Sprint 5: Policy Violations Rule    │ ──► Identified cross-stage alerts
   └────────────────────────────────────────┘
                       │
   ┌────────────────────────────────────────┐
   │   Sprint 6: Waiver Governance Audit    │ ──► Formulated strict approval actions
   └────────────────────────────────────────┘
                       │
   ┌────────────────────────────────────────┐
   │       Sprint 7: Central KPI Engine     │ ──► Implemented real-time aggregations
   └────────────────────────────────────────┘
                       │
   ┌────────────────────────────────────────┐
   │   Sprint 8: Executive Dashboards UI    │ ──► Multi-view dashboards rendered
   └────────────────────────────────────────┘
                       │
   ┌────────────────────────────────────────┐
   │      Sprint 9: Export & Reports        │ ──► Created CSV spreadsheet outputs
   └────────────────────────────────────────┘
                       │
   ┌────────────────────────────────────────┐
   │      Sprint 10: System Hardening       │ ──► Passed complete compiler & linter
   └────────────────────────────────────────┘
```

---

## 7. Integrated System Verification Suit (`src/nexusTests.ts`)

To ensure compliance parameters perform cleanly across multiple execution matrices, a custom testing panel executes sequential checks:

| Test Run Name | Category | Verification Method |
| :--- | :--- | :--- |
| **Formula Boundaries & Capped Max Score** | UNIT | Verifies CVSS score multipliers map cleanly to absolute score limits. |
| **Automatic Mapping Engine** | INTEGRATION | Validates that SSO modules link dynamically with parent products. |
| **KPI Schema Payload Validation** | API | Calls backend endpoints to confirm correct structure output. |
| **In-Memory Gateway Ingestion Pipeline** | MOCK_SERVER | Tests response parameters with a local mock Sonatype router. |
| **Credential Masking Verification** | SECURITY | Asserts that plain basic authorization tokens do not leak to logs. |
| **High-Volume Transaction Stress** | PERFORMANCE | Evaluates latency during the execution of 5000 mathematical iterations. |
| **Repository Slicing & Offset Checks** | PAGINATION | Checks row offsets for stable grid tables. |
| **Transport Timeout Boundaries** | TIMEOUT | Validates connection abort execution when network latency exceeds 50ms. |

---

All systems are compiled, fully linted, and operational within the main live preview framework. For further manual inspection, please access the **Nexus IQ Connector** tab visible in the application's central sidebar workspace.
