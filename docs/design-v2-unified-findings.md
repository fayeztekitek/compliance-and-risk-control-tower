# Design v2: Unified Findings & Multi-Scanner Architecture

## 1. Challenge: Current Architecture Has 4 Fragmented Finding Tables

| Table | Source | Fields | Purpose |
|-------|--------|--------|---------|
| `vulnerabilities` | Internal/manual | 22 columns, references waivers/RA | Security vulns from manual entry, Nexpose, Pen Test, Veracode |
| `nexus_vulnerabilities` | Nexus IQ SCA | 20 columns, references apps/scans | Open-source component vulns from Sonatype Nexus IQ |
| `audit_findings` | Internal audit | 6 columns, references audits | Findings discovered during compliance audits |
| `findings` (implied in projects) | Project context | Minimal | General project-level findings |

### Problems with this design:

**1. No cross-tool visibility.** A dashboard cannot show "all CRITICAL findings across all tools" without a UNION query across 3+ tables with different column names and semantics.

**2. Duplicated logic.** Every service that lists, filters, or aggregates findings must know which table to query. Adding a 4th scanner (Fortify) means a 4th table, 4th repo class, 4th set of routes.

**3. Inconsistent risk scoring.** `riskScoreService.calculate()` works only on `nexus_vulnerabilities` shape. `security.service.ts` has no risk scoring at all. `audit_findings` has no risk score. Different tools produce different risk pictures that cannot be compared.

**4. Impossible to deduplicate.** The same CVE can appear in both `nexus_vulnerabilities` (SCA scan) and `vulnerabilities` (manual entry). Without a unified table, there is no way to link them or prevent double-counting.

**5. Regulatory mapping is absent.** No table carries GDPR/DORA/ISO 27001 tags. Compliance reporting requires separate JOINs and manual mapping.

**6. No scale path.** `nexus_vulnerabilities` has no partitioning. `vulnerabilities` has no partitioning. At 36K–131K findings/month, performance degrades within 6 months.

---

## 2. Proposed Solution: `unified_findings` Table

### 2.1 Schema

```sql
CREATE TYPE finding_source AS ENUM (
  'NEXUS', 'FORTIFY', 'SONARQUBE', 'VERACODE', 'INTERNAL', 'PEN_TEST', 'NEXPOSE'
);

CREATE TYPE unified_finding_status AS ENUM (
  'OPEN', 'FIXED', 'ACCEPTED', 'WAIVED', 'FALSE_POSITIVE', 'UNDER_REVIEW'
);

CREATE TYPE regulatory_framework AS ENUM (
  'GDPR', 'DORA', 'SOX', 'PCI_DSS', 'ISO_27001', 'NIST_800_53', 'NONE'
);

CREATE TABLE unified_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Source identification
  source_tool finding_source NOT NULL,
  source_id VARCHAR(255),                    -- native ID in source tool
  source_table VARCHAR(50),                  -- original table name (for migration)

  -- Product/application context
  product_id UUID REFERENCES nexus_products(id) ON DELETE SET NULL,
  application_id UUID REFERENCES nexus_applications(id) ON DELETE SET NULL,
  target_product VARCHAR(255),               -- free-form product name

  -- Finding details
  title TEXT NOT NULL,
  description TEXT,
  unified_severity severity NOT NULL,         -- CRITICAL / HIGH / MEDIUM / LOW
  native_severity VARCHAR(50),               -- original severity string from tool
  cvss_score NUMERIC(3,1),
  cvss_vector VARCHAR(255),
  cve_id VARCHAR(20),
  cwe_id VARCHAR(20),

  -- Status & remediation
  status unified_finding_status NOT NULL DEFAULT 'OPEN',
  remediation TEXT,
  fix_available BOOLEAN DEFAULT FALSE,
  recommended_version VARCHAR(100),
  detected_date DATE NOT NULL DEFAULT CURRENT_DATE,
  remediated_date DATE,
  sla_due_date DATE,

  -- Risk scoring (EPSS-based)
  epss_score NUMERIC(6,5) DEFAULT 0,          -- EPSS v2 probability 0.00000–0.99999
  cisa_kev BOOLEAN DEFAULT FALSE,             -- listed in CISA Known Exploited Vulns
  risk_score NUMERIC(5,2),                    -- computed unified score 0–100

  -- Nexus-specific (nullable)
  component_name VARCHAR(255),
  component_version VARCHAR(100),
  package_url TEXT,
  dependency_type dependency_type,
  reachability reachability,
  exploitability exploitability,
  age_in_days INTEGER DEFAULT 0,
  first_seen_date DATE,
  last_seen_date DATE,
  scan_id VARCHAR(100),

  -- Regulatory
  regulatory_tags regulatory_framework[] DEFAULT '{}',
  pii_impact BOOLEAN DEFAULT FALSE,

  -- Governance links
  waiver_id UUID,                             -- references unified waivers table
  risk_acceptance_id UUID,                    -- references unified risk_acceptances
  audit_finding_id UUID,                      -- link to audit_findings if applicable

  -- Soft delete
  deleted_at TIMESTAMPTZ,

  -- Source metadata
  metadata JSONB                              -- tool-specific extra data
);
```

### 2.2 Index Strategy

```sql
CREATE INDEX idx_uf_source ON unified_findings(source_tool);
CREATE INDEX idx_uf_severity ON unified_findings(unified_severity);
CREATE INDEX idx_uf_status ON unified_findings(status);
CREATE INDEX idx_uf_product ON unified_findings(product_id);
CREATE INDEX idx_uf_cve ON unified_findings(cve_id);
CREATE INDEX idx_uf_cvss ON unified_findings(cvss_score);
CREATE INDEX idx_uf_epss ON unified_findings(epss_score);
CREATE INDEX idx_uf_sla ON unified_findings(sla_due_date);
CREATE INDEX idx_uf_regulatory ON unified_findings USING GIN(regulatory_tags);
CREATE INDEX idx_uf_risk ON unified_findings(risk_score);
```

### 2.3 Partitioning Strategy (Phase 2)

```sql
-- After migration, convert to partitioned table:
CREATE TABLE unified_findings_partitioned (
  LIKE unified_findings INCLUDING DEFAULTS INCLUDING CONSTRAINTS
) PARTITION BY RANGE (detected_date);

CREATE TABLE uf_2024 Q1 PARTITION OF unified_findings_partitioned
  FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');
-- ... monthly partitions created by cron job
```

### 2.4 What This Replaces

| Old Table | New Home | Migration Strategy |
|-----------|----------|-------------------|
| `vulnerabilities` (security) | `unified_findings` WHERE source_tool IN ('INTERNAL','PEN_TEST','NEXPOSE','VERACODE') | INSERT INTO unified_findings SELECT ... FROM vulnerabilities |
| `nexus_vulnerabilities` | `unified_findings` WHERE source_tool = 'NEXUS' | INSERT INTO unified_findings SELECT ... FROM nexus_vulnerabilities |
| `audit_findings` | RETAINED (different semantics — audit context) | Keep as-is, optionally link via audit_finding_id |

**`audit_findings` is retained** because it represents findings within an audit context (linked to a specific audit event). These can optionally be promoted to `unified_findings` with `source_tool = 'INTERNAL'` and `audit_finding_id` for cross-dashboard visibility.

---

## 3. Risk Score Rebalancing

### 3.1 Current Formula (Broken)

```
score = CVSS×4 + severity(2-15) + reachability(0-15) + exploitability(0-10)
      + age(2-10) + criticality(1-10) - waiver(0-15) + fix_penalty(0-10)
```

Problems:
- CVSS×4 dominates (36 pts for CRITICAL before other factors)
- Fix availability is a PENALTY (+10) — rewards ignorance
- Exploitability factor has no data source
- No EPSS or CISA KEV integration

### 3.2 Proposed Formula (EPSS-Based)

| Factor | Weight | Max | Source |
|--------|--------|-----|--------|
| CVSS Score | ×2.5 | 25 | Already have it |
| EPSS Score | ×30 | 30 | NVD API / EPSS feed |
| CISA KEV Listed | 15/0 | 15 | CISA KEV catalog |
| Reachability | 10/3/0 | 10 | Nexus IQ |
| Business Criticality | 8/5/2/0 | 8 | Product config |
| Age (days/10, capped) | linear | 7 | days_since_detected |
| Fix Available | +0/−5 | −5 | Rebate, not penalty |
| Regulatory Tag | 5/0 | 5 | compliance_classification |
| **Total** | | **100** | |

**Grading:** GREEN 0–25, YELLOW 26–50, ORANGE 51–75, RED 76–100.

### 3.3 EPSS Data Feed

```
GET https://api.first.org/epss/data?v=2&cve-id=CVE-2024-XXXXX
→ { "epss": "0.95742" }

GET https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json
→ [ { "cveID": "CVE-2024-XXXXX", ... } ]
```

Both feeds are fetched by a scheduled BullMQ job (`kpi-recalc` queue) and cached in a `vulnerability_enrichments` table.

---

## 4. Multi-Scanner Architecture

```
┌──────────────┐    ┌────────────────┐    ┌──────────────────┐
│ Fortify SSC  │───→│ FortifyAdapter │───→│                  │
│ (REST API)   │    │ (poll 6h cron) │    │                  │
└──────────────┘    └────────────────┘    │                  │
                                          │  Normalization   │
┌──────────────┐    ┌────────────────┐    │  Layer (BullMQ)  │
│ Nexus IQ     │───→│ NexusAdapter   │───→│                  │
│ (REST API)   │    │ (poll 1h cron) │    │   → Dedup        │
└──────────────┘    └────────────────┘    │   → EPSS enrich  │
                                          │   → Risk score   │
┌──────────────┐    ┌────────────────┐    │   → Write to     │
│ SonarQube    │───→│ SonarQubeHook  │───→│     unified_     │
│ (Webhook)    │    │ (push + poll)  │    │     findings     │
└──────────────┘    └────────────────┘    │                  │
                                          │                  │
┌──────────────┐    ┌────────────────┐    │                  │
│ Veracode     │───→│ VeracodeAdapter│───→│                  │
│ (Colline)    │    │ (poll daily)   │    └──────────────────┘
└──────────────┘    └────────────────┘
```

### 4.1 Scanner Adapter Interface

```typescript
interface ScannerAdapter {
  readonly source: FindingSource;
  fetchFindings(since: Date): Promise<RawFinding[]>;
  normalize(raw: RawFinding): UnifiedFindingInput;
}
```

### 4.2 Shared `ScannerHttpClient` Base Class

Extracted from current `NexusHttpClient`:
- Exponential backoff
- Rate limiting per source tool
- Configurable timeouts
- Logging via Pino

---

## 5. Regulatory Compliance Classification

### 5.1 New Table

```sql
CREATE TABLE compliance_classification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  finding_id UUID REFERENCES unified_findings(id) ON DELETE CASCADE,
  framework regulatory_framework NOT NULL,
  control_id VARCHAR(50),            -- e.g., "A.12.6.1" for ISO 27001
  requirement TEXT,
  impact_assessment TEXT,
  UNIQUE (finding_id, framework, control_id)
);
```

### 5.2 Mapping Rules

| Framework | Severity Threshold | SLA |
|-----------|-------------------|-----|
| GDPR (Art. 32–33) | CRITICAL/HIGH with PII impact | 72h notification |
| DORA | CRITICAL/HIGH on critical functions | 24h notification |
| ISO 27001 A.12.6.1 | All severities | Per policy SLA |
| NIST SP 800-53 RA-5 | All severities | 30/60/90 day SLA |

---

## 6. Data Migration Strategy

### 6.1 Migration 013: Create `unified_findings` table

- Create the table, indexes, triggers
- Create `finding_source`, `unified_finding_status`, `regulatory_framework` enums

### 6.2 Migration 014: Migrate `vulnerabilities` → `unified_findings`

```sql
INSERT INTO unified_findings (
  source_tool, source_id, source_table,
  target_product, title, unified_severity, status,
  detected_date, remediated_date, sla_due_date,
  waiver_id, risk_acceptance_id, metadata
)
SELECT
  CASE source_scanner
    WHEN 'VERACODE' THEN 'VERACODE'::finding_source
    WHEN 'NEXPOSE' THEN 'NEXPOSE'::finding_source
    WHEN 'PEN_TEST' THEN 'PEN_TEST'::finding_source
    ELSE 'INTERNAL'::finding_source
  END,
  id::text, 'vulnerabilities',
  target_product, title, severity,
  CASE status
    WHEN 'OPEN' THEN 'OPEN'::unified_finding_status
    WHEN 'FALSE_POSITIVE' THEN 'FALSE_POSITIVE'::unified_finding_status
    WHEN 'WAIVED' THEN 'WAIVED'::unified_finding_status
    WHEN 'REMEDIATED' THEN 'FIXED'::unified_finding_status
  END,
  detected_date, remediated_date, sla_due_date,
  waiver_id, risk_acceptance_id,
  jsonb_build_object('source_scanner', source_scanner, 'explanation_false_positive', explanation_false_positive, 'owner', owner)
FROM vulnerabilities WHERE deleted_at IS NULL;
```

### 6.3 Migration 015: Migrate `nexus_vulnerabilities` → `unified_findings`

```sql
INSERT INTO unified_findings (
  source_tool, source_id, source_table,
  product_id, application_id,
  title, unified_severity, cvss_score, cvss_vector, cve_id,
  status, component_name, component_version, package_url,
  dependency_type, reachability, exploitability, age_in_days,
  first_seen_date, last_seen_date, scan_id, fix_available,
  recommended_version, detected_date, metadata
)
SELECT
  'NEXUS'::finding_source,
  vulnerability_id, 'nexus_vulnerabilities',
  NULL, application_id,
  COALESCE(cve_id, component_name || ':' || component_version), severity,
  cvss_score, cvss_vector, cve_id,
  CASE status
    WHEN 'Open' THEN 'OPEN'::unified_finding_status
    WHEN 'Fixed' THEN 'FIXED'::unified_finding_status
    WHEN 'Accepted' THEN 'ACCEPTED'::unified_finding_status
    WHEN 'Waived' THEN 'WAIVED'::unified_finding_status
    WHEN 'False Positive' THEN 'FALSE_POSITIVE'::unified_finding_status
  END,
  component_name, component_version, package_url,
  dependency_type, reachable, exploitability, age_in_days,
  first_seen_date, last_seen_date, scan_id, fix_available,
  recommended_version, first_seen_date,
  jsonb_build_object('ref_id', ref_id, 'original_vulnerability_id', vulnerability_id)
FROM nexus_vulnerabilities;
```

### 6.4 Migration 016: Create views for backward compatibility

```sql
CREATE VIEW vulnerabilities_view AS
SELECT
  id, created_at, updated_at, title,
  unified_severity AS severity,
  status::text AS status,
  source_tool::text AS source_scanner,
  detected_date, remediated_date, sla_due_date,
  target_product, waiver_id, risk_acceptance_id
FROM unified_findings
WHERE source_tool IN ('VERACODE', 'NEXPOSE', 'PEN_TEST', 'INTERNAL')
  AND deleted_at IS NULL;
```

---

## 7. Rollout Strategy

| Phase | Migration | Code Changes | Risk |
|-------|-----------|-------------|------|
| **1a** | 013: Create unified_findings table | None (new table only) | None — no existing code affected |
| **1b** | 014–015: Migrate data | Update services/repos to READ from unified_findings (dual-write optional) | Medium — existing queries must keep working |
| **1c** | 016: Backward compat views | Update services/repos to WRITE to unified_findings; deprecate old tables | High — requires careful testing |
| **2** | None | EPSS feed job, risk score rebalance | Medium — scoring changes affect dashboards |
| **3** | None | Fortify adapter + new routes | Low — additive |
| **4** | None | SonarQube webhook + adapter | Low — additive |
| **5** | 017: Compliance classification | New table + routes | Low — additive |
| **6** | 018: Partitioning | Archive cron job | Medium — requires data migration |
