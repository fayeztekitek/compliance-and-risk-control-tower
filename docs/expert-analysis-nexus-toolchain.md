# Expert Analysis: Nexus IQ Connector Architecture & Security Toolchain

Based on `log-ia-conversation.md` — Reviewed against the actual security tooling landscape of Vermeg (Fortify OpenText, Nexus IQ Lifecycle, SonarQube, Veracode)

---

## 1. Executive Summary of the Proposed Architecture

The document describes a comprehensive SQL schema, risk-scoring model, and sync pipeline for ingesting Sonatype Nexus IQ Lifecycle data into the Control Tower. It targets **8 Vermeg products** (Megara, Soliam, Digital Insurance, Framework, Solife, Digital Banking, Solife Digital Platform, Colline) with a proprietary risk-scoring formula combining CVSS, severity, reachability, exploitability, age, criticality, waivers, and fix availability.

**What got built:** Our current migration `008_nexus_ingestion.sql` implements 9 core tables + 3 operational tables (KPI snapshots, sync logs, config), with proper PostgreSQL enums, 18 indexes, and auto-update triggers. The risk-score service (`RiskScoreService`) implements an 8-factor formula with RED/ORANGE/GREEN grading. The sync pipeline is skeleton-only (vulnerabilities materialized, everything else fetched but discarded).

---

## 2. Challenge of the Proposed Thoughts

### 2.1 Fragmented Single-Vendor View

The document treats Nexus IQ as the **sole** security telemetry source — it mentions 50 scan histories, 200 vulnerabilities, 80 policy violations — all from one tool. In reality, Vermeg uses **four distinct scanners**:

| Scanner | Coverage | What It Finds |
|---------|----------|--------------|
| **Fortify OpenText** (SAST) | All 8 products | Source code vulnerabilities (injection, XSS, crypto flaws) |
| **Nexus IQ Lifecycle** (SCA) | All 8 products | Open-source component vulns, license risks, policy violations |
| **SonarQube** | All 8 products | Code quality issues, technical debt, security hotspots |
| **Veracode** | **Colline only** | DAST/SAST for the Colline application specifically |

A compliance control tower that only ingests Nexus IQ is **missing 75% of the risk surface**.

### 2.2 Risk Score Formula Is Over-Engineered and Unvalidated

The 8-factor formula (CVSS×4 + severity + reachability + exploitability + age + criticality + waiver discount + fix penalty) with a 0–100 range is academically interesting but has flaws:

- **No empirical calibration:** What is the false-positive/negative rate? Has this been validated against actual incident data?
- **CVSS×4 dominates:** A CRITICAL vuln (CVSS 9.0) starts at 36 points before any other factor. A LOW vuln (CVSS 2.0) starts at 8. The severity factor (+15 for CRITICAL, +2 for LOW) barely moves the needle. The reachability factor (+15 or 0) has more impact than severity. This weighting is inverted from security best practice.
- **Age factor is binary:** >90 days = 10, 30–90 days = 5, <30 days = 2. This conflates "known for 31 days" with "known for 89 days" — both get 5 points. A finer gradient is needed.
- **Fix availability penalty (+10) rewards ignorance:** A vuln without a known fix scores LOWER than one with a fix available. This disincentivizes identifying remediations.
- **No exploitability scoring:** The formula includes "exploitability" (EASY/MEDIUM/HARD/THEORETICAL) but no data source feeds this — no EPSS (Exploit Prediction Scoring System) integration, no CISA KEV catalog check, no proof-of-concept monitoring.

### 2.3 Missing Multi-Scanner Aggregation

The document's architecture assumes a **single pipeline** (Nexus → DB → Dashboard). A production compliance tower needs:

```
Fortify OpenText ─┐
Nexus IQ ─────────┤
SonarQube ────────┤──→ Normalization Layer ──→ Unified Risk DB ──→ Dashboard
Veracode ─────────┘
```

Each scanner has its own CVSS mappings, severity scales (Fortify: Critical/High/Medium/Low; SonarQube: A–E; Veracode: Very High/High/Medium/Low), and vuln categories. Without **cross-tool normalization**, the dashboard shows four separate silos, not a unified risk picture.

### 2.4 Missing Colline-Specific Considerations

Veracode is used **exclusively for Colline** — meaning Colline has a DAST/SAST assessment that the other products don't. This creates a **coverage disparity**:

- Colline appears more vulnerable simply because it has more scanners pointing at it
- The risk-score formula should account for **scanning depth** (normalize by number of scanners)
- A Veracode "Very High" finding needs to be mapped to the same risk scale as a Fortify "Critical" — they are not equivalent

---

## 3. Compliance Expert Perspective

### 3.1 Regulatory Mapping Gap

The proposed model tracks vulnerabilities technically but lacks **regulatory classification**:

| Regulation | What It Demands | Current Gap |
|-----------|----------------|-------------|
| **GDPR** (Art. 32–33) | 72-hour breach notification, PII-specific vuln tracking | No `pii_impact` field on vulns; no incident notification workflow |
| **DORA** (EU 2022/2554) | ICT risk classification, incident reporting, resilience testing | No `dora_critical_function` tag; no business impact assessment (BIA) linkage |
| **ISO 27001** (A.12.6.1) | Patch management, vulnerability tracking with SLAs | Partial: SLA tracking exists per vuln but no audit trail for management review |
| **NIST SP 800-53** | SI-2 (flaw remediation), RA-5 (vulnerability scanning), CA-7 (continuous monitoring) | No mapping of findings to NIST control families |
| **BCBS 239** (for banking products) | Risk data aggregation, accuracy, completeness | No data lineage tracking; no attestation workflow |

### 3.2 Audit Trail Deficiency

The compliance workspace requires **who approved what, when, and why**. The current schema records waivers/acceptances but:

- No digital signature / e-seal requirement for high-risk waivers (eIDAS compliance)
- No mandatory review period for waivers (ISO 27001 requires periodic re-assessment)
- No linkage between audit findings and specific vulnerabilities (the `security.vulnerabilities` table and `audit_findings` table are disconnected)

### 3.3 Recommendation

**Add a `compliance_classification` table** that maps each vulnerability to regulations, control families, and business processes. Each vuln should carry a `regulatory_impact` enum: `GDPR`, `DORA`, `SOX`, `PCI_DSS`, `ISO_27001`, `NONE`.

---

## 4. Security Expert & Privacy Leader Perspective

### 4.1 Fortify OpenText Integration Strategy

Fortify OpenText (Fortify SSC / Fortify on Demand) is a **SAST** tool — it finds injection flaws, cryptographic weaknesses, and authentication bypasses at the source-code level. These are architecturally different from the component-level vulns that Nexus IQ finds.

**Key integration points:**
- **Fortify REST API** → `GET /api/v3/projects/{id}/latest-issue-filter` for issue extraction
- **FPR (Fortify Project Result) files** → XML/JSON parsing for offline analysis
- **Priority mapping:** Fortify uses "friority" (1–5, where 1 is worst). This must be mapped to our severity scale:
  - Fortify Critical (friority 1) ↔ Our CRITICAL
  - Fortify High (friority 2) ↔ Our HIGH
  - Fortify Medium (friority 3) ↔ Our MEDIUM
  - Fortify Low (friority 4–5) ↔ Our LOW

**Privacy dimension:** Fortify can detect PII exposure flaws (e.g., logging credit cards, exposing personal data in URLs). The schema should flag findings by `pii_category` (`NONE`, `PII_COMMON`, `PII_SENSITIVE`, `HEALTH_DATA`, `FINANCIAL_DATA`).

### 4.2 SonarQube Integration Strategy

SonarQube provides **code quality + security hotspots** — not traditional vulns but potential risk areas. A Security Hotspot (SH) requires manual review to confirm exploitability.

**Key integration points:**
- **SonarQube Web API** → `GET /api/hotspots/search` and `GET /api/issues/search`
- **Quality Gate status** → PASSED/WARNING/FAILED should be a KPI on the executive dashboard
- **Severity mapping:** SonarQube uses BLOCKER/CRITICAL/MAJOR/MINOR/INFO → this is finer than our 4-level scale. We should collapse BLOCKER→CRITICAL, CRITICAL→HIGH, MAJOR→MEDIUM, MINOR/INFO→LOW.

**Privacy dimension:** SonarQube rules include `S5332` (cleartext protocols), `S2068` (hard-coded passwords) — both GDPR-relevant. Each hotspot should include a `gdpr_relevance` boolean.

### 4.3 Veracode Integration (Colline-Specific)

Veracode offers **SAST + DAST + SCA** — but for Colline, it's likely SAST-only (policy-based scanning of compiled code).

**Key integration points:**
- **Veracode API** → `GET /api/auth/auth/v1/codestream/{appGuid}/findings`
- **Mitigation status:** Veracode distinguishes "accepted" vs "remediated" vs "false positive" — needs mapping to our `finding_status` enum
- **Flaw severity:** Veracode uses "Very High" (5), "High" (4), "Medium" (3), "Low" (2), "Very Low" (1). The "Very High" level is missing from our enum — we need to add it.

### 4.4 Unified Risk Normalization

The **most critical architectural gap** is the absence of a **Unified Finding** abstraction layer. Currently:

- `security.vulnerabilities` — stores our proprietary security vulns
- `nexus_vulnerabilities` — stores Nexus IQ SCA vulns  
- `findings` (in projects context) — stores audit findings
- Fortify vulns → would need a new table
- SonarQube hotspots → would need a new table
- Veracode flaws → would need a new table

**This is unsustainable.** We need a `unified_findings` table:

```sql
CREATE TABLE unified_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_tool VARCHAR(50) NOT NULL,       -- 'nexus' | 'fortify' | 'sonarqube' | 'veracode' | 'internal'
  source_id VARCHAR(255) NOT NULL,         -- original ID in the source tool
  product_id UUID REFERENCES nexus_products(id),
  application_id UUID REFERENCES nexus_applications(id),
  title TEXT NOT NULL,
  description TEXT,
  unified_severity severity_enum NOT NULL, -- CRITICAL | HIGH | MEDIUM | LOW
  native_severity VARCHAR(50) NOT NULL,    -- original severity from tool
  cvss_score NUMERIC(3,1),
  cve_id VARCHAR(20),
  cwe_id VARCHAR(20),
  status finding_status DEFAULT 'OPEN',
  pii_impact BOOLEAN DEFAULT FALSE,
  regulatory_tags TEXT[],                  -- array of regulation codes
  remediation TEXT,
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  remediated_at TIMESTAMPTZ,
  sla_due_date DATE,
  risk_score NUMERIC(5,2),                -- unified cross-tool risk score
  metadata JSONB                          -- tool-specific extra data
);
```

This single table replaces `security.vulnerabilities` and `nexus_vulnerabilities` and provides a common target for Fortify, SonarQube, and Veracode imports.

### 4.5 Risk Score Formula Rebalancing

Based on security best practices and EPSS v2 data, I recommend:

| Factor | Weight | Max | Rationale |
|--------|--------|-----|-----------|
| CVSS Score | ×2.5 | 25 | Reduced dominance; EPSS shows CVSS 9+ ≠ exploitable |
| EPSS Score | ×30 | 30 | Industry-standard exploit probability (0–1) |
| CISA KEV Listed | 15/0 | 15 | Known exploited vulns are highest priority |
| Reachability | 10/3/0 | 10 | REACHABLE=10, UNKNOWN=3, NOT_REACHABLE=0 |
| Business Criticality | 8/5/2/0 | 8 | CRITICAL/HIGH/MEDIUM/LOW |
| Age (days / 10) | capped 7 | 7 | Linear gradient: every 10 days = +1, max 70 days+ |
| Fix Available | –5 / +0 | –5 | Rebate if fix exists, no penalty |
| Regulatory Tag | 5/0 | 5 | +5 if tied to GDPR/DORA requirement |
| **Total** | | **100** | |

Grading: GREEN 0–25, YELLOW 26–50, ORANGE 51–75, RED 76–100.

Key changes from the proposed formula:
- EPSS replaces the subjective "exploitability" factor
- CISA KEV adds a hard binary for known-exploited vulnerabilities
- Age is linear, not bracketed
- Fix availability is a small rebate, not a penalty
- Regulatory impact adds a compliance-relevant boost

---

## 5. Cloud Architect Perspective

### 5.1 Multi-Scanner Data Pipeline Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Fortify SSC    │────→│  Scanner Adapter  │────→│                 │
│  / Fortify on   │     │  (poll/API)       │     │                 │
│  Demand         │     └──────────────────┘     │                 │
└─────────────────┘                               │                 │
                                                  │  Normalization  │
┌─────────────────┐     ┌──────────────────┐     │  & Dedup Layer  │
│  Nexus IQ       │────→│  Scanner Adapter  │────→│  (BullMQ Queue) │
│  Lifecycle      │     │  (poll/API)       │     │                 │
└─────────────────┘     └──────────────────┘     │                 │
                                                  │                 │
┌─────────────────┐     ┌──────────────────┐     │                 │
│  SonarQube      │────→│  Scanner Adapter  │────→│                 │
│                 │     │  (webhook + poll) │     │                 │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                           │
┌─────────────────┐     ┌──────────────────┐              │
│  Veracode       │────→│  Scanner Adapter  │──────────────┘
│  (Colline only) │     │  (API)            │
└─────────────────┘     └──────────────────┘
                                                           │
                                                           ▼
                                                  ┌─────────────────┐
                                                  │  Unified DB     │
                                                  │  (unified_      │
                                                  │  findings table)│
                                                  └─────────────────┘
```

### 5.2 Scalability Concerns

The current architecture uses a **synchronous API call → DB write** pattern in a single Node.js process. With 4 scanners producing potentially thousands of findings:

- **Fortify:** A single scan can produce 10,000+ issues (especially if "all" severity levels are included). The current `INSERT INTO` pattern per finding will block the event loop.
- **Nexus IQ:** The existing sync already retrieves organizations + applications + vulnerabilities — but doesn't batch-insert. The `gen_random_uuid()` + `ON CONFLICT` per row approach works for 15 seed vulns but will fail at 10,000+.
- **SonarQube:** Webhook delivery (push-based) is preferred over polling. The current BullMQ stack supports webhook ingestion via a dedicated queue.

**Recommendation:** Implement **batch insert** (1000 rows per statement) with `ON CONFLICT DO NOTHING` for all scanner adapters. Use the existing BullMQ queues (`nexus-sync` renamed to `scanner-sync`) with per-scanner job types.

### 5.3 Storage Projections

| Scanner | Estimated Findings/Scan | Frequency | Monthly Volume |
|---------|----------------------|-----------|---------------|
| Fortify (8 products) | 5,000–15,000 | Weekly | 20,000–60,000 |
| Nexus IQ (8 products) | 200–1,000 | Daily | 6,000–30,000 |
| SonarQube (8 products) | 500–2,000 | Per commit | 10,000–40,000 |
| Veracode (Colline only) | 100–500 | Per release | 200–1,000 |

**Total: 36,000–131,000 findings/month** → ~1.2M–4.3M records/year. At this scale:

- The current `unified_findings` table design (no partitioning) will degrade query performance in 6–8 months
- **Add partitioning** by `discovered_at` (monthly range partitions) and by `source_tool` (list partitioning)
- **Archive** findings older than 12 months to a `findings_archive` table with the same schema
- **Materialized views** for the Executive Dashboard (refresh daily, not per-request)

### 5.4 API Rate Limiting & Backpressure

Each scanner adapter must respect the source tool's rate limits:

| Tool | Rate Limit | Risk |
|------|-----------|------|
| Fortify SSC | 50 req/min (default) | Easy to hit with pagination |
| Nexus IQ | 100 req/min (default) | Moderate |
| SonarQube | No documented limit (practical ~60/min) | Low |
| Veracode | Varies by plan (typically 30/min) | Moderate |

The existing `NexusHttpClient` has exponential backoff — this pattern should be **extracted into a shared `ScannerHttpClient` base class** used by all four adapters.

### 5.5 Webhook vs Polling Strategy

| Tool | Recommended Mode | Reason |
|------|-----------------|--------|
| Fortify | **Poll** (cron every 6h) | No webhook support in SSC; FoD has webhooks but enterprise customers prefer polling |
| Nexus IQ | **Poll** (cron every 1h) | Webhook support exists but is unreliable at scale |
| SonarQube | **Webhook** (push) | Native webhook support, instant delivery |
| Veracode | **Poll** (cron daily + on release) | No webhook for findings; only for pipeline status |

---

## 6. Prioritized Implementation Roadmap

| Priority | Task | Effort | Risk Reduction |
|----------|------|--------|---------------|
| **P0** | Create `unified_findings` table + migration | 2 days | Eliminates schema fragmentation |
| **P0** | Normalize existing `security.vulnerabilities` and `nexus_vulnerabilities` into unified table | 3 days | Single source of truth for dashboard |
| **P1** | Build Fortify SSC adapter (scanner client + sync service) | 5 days | Covers 50%+ of vuln surface |
| **P1** | Build SonarQube webhook handler + adapter | 3 days | Real-time code quality data |
| **P1** | Integrate EPSS scoring + CISA KEV feed into risk score | 2 days | Industry-standard exploit scoring |
| **P2** | Build Veracode adapter (Colline-specific) | 3 days | Colline compliance requirement |
| **P2** | Add monthly range partitioning to unified_findings | 1 day | Prevent performance degradation |
| **P2** | Create compliance_classification table + regulatory mapping UI | 4 days | Meet GDPR/DORA/ISO requirements |
| **P3** | Extract `ScannerHttpClient` base class from `NexusHttpClient` | 1 day | Eliminate code duplication |
| **P3** | Add data retention/archival policy | 2 days | Manage storage costs |
| **P3** | Build materialized views for executive dashboard | 2 days | Dashboard performance at scale |

---

## 7. Conclusion

The `log-ia-conversation.md` document presents a technically sound but **incomplete** vision. Its single-vendor focus on Nexus IQ, over-engineered risk formula, and missing regulatory mapping create four critical gaps:

1. **Tool coverage gap:** 3⁄4th of Vermeg's security toolchain (Fortify, SonarQube, Veracode) is not integrated
2. **Schema gap:** The dual-table design (`security.vulnerabilities` + `nexus_vulnerabilities`) is unsustainable with 2+ additional scanners
3. **Regulatory gap:** No GDPR/DORA/ISO 27001 mapping, no PII classification, no breach notification workflow
4. **Scale gap:** The current synchronous single-row INSERT pattern will fail at production volumes (36K–131K findings/month)

**The risk-score formula should be retired in favor of an EPSS-based model** with CISA KEV overlay — aligning with NIST IR 8401 and industry best practice.

The proposed schema (008 migration) is a solid foundation. What's needed is a **unified finding model**, four scanner adapters, and a batch-insert pipeline — which together transform this from a Nexus-IQ-only viewer into a true multi-scanner Compliance Control Tower.
