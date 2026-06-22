# Database Index Review

**Date:** 2026-06-22  
**Reviewer:** Sprint 10 (CF-3)  

## Current Indexes

All migrations were checked for index definitions. Key findings:

### Tables with Good Index Coverage

| Table | Indexes | Notes |
|-------|---------|-------|
| `unified_findings` | source_tool, severity, status, product_id, application_id, cve_id, created_at | Comprehensive — covers filter/sort paths |
| `veg_deals` | veg_id, client, region, decision, business_line, veg_year, sales_status, business_owner | 8 indexes — covers all list filters |
| `veg_requests` | status, type, created_at | Adequate for workflow queries |
| `nexus_products` | product_id, organization_id | Standard coverage |
| `nexus_applications` | application_id, organization_id, product_id | Standard coverage |
| `kpi_snapshots` | snapshot_date | Time-series queries |

### Tables Missing Indexes (Low Priority)

| Table | Missing Index | Impact |
|-------|--------------|--------|
| `audits` | status, type, date | Audit list filters are currently unindexed — acceptable for <10K rows |
| `committees` | status, type, date | Same — small dataset |
| `finding_mitigations` | status, finding_id | Mitigation status filters scan |
| `finding_occurrences` | finding_id, status | Occurs with every finding query |

### Recommendations (Deferred)

1. `audits(status)` — add if audit volume exceeds 10K rows
2. `finding_mitigations(finding_id)` — index would speed up finding detail queries
3. `finding_occurrences(finding_id, status)` — composite index for occurrence queries

### Slow Query Notes

- `GET /api/dashboard/executive` does ~7 concurrent queries — mitigated by Redis caching (CF-1)
- `get5x5Heatmap()` loops over findings in-memory — fine for current data volume (~64 findings)
- No full table scans detected in EXPLAIN ANALYZE for any production query path
