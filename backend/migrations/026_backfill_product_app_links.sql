-- ============================================================================
-- Migration 026: Backfill product_id and application_id in unified_findings
-- Populates NULL FK columns by joining source tables.
-- ============================================================================

-- 1. Backfill product_id for vulnerabilities that have a target_product matching nexus_products.product_id
UPDATE unified_findings uf
SET product_id = np.id
FROM nexus_products np
WHERE uf.product_id IS NULL
  AND uf.source_table IN ('vulnerabilities', 'nexus_vulnerabilities')
  AND uf.target_product IS NOT NULL
  AND np.product_id = uf.target_product;

-- 2. Backfill application_id for nexus_vulnerabilities that have an application_id
-- matching nexus_applications.application_id (both are VARCHAR)
UPDATE unified_findings uf
SET application_id = na.id
FROM nexus_applications na
WHERE uf.application_id IS NULL
  AND uf.source_table = 'nexus_vulnerabilities'
  AND uf.source_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM nexus_vulnerabilities nv
    WHERE nv.vulnerability_id = uf.source_id
      AND na.application_id = nv.application_id
  );

-- 3. Backfill product_id via target_product → product name fuzzy match
UPDATE unified_findings uf
SET product_id = np.id
FROM nexus_products np
WHERE uf.product_id IS NULL
  AND uf.source_table = 'vulnerabilities'
  AND uf.target_product IS NOT NULL
  AND (
    uf.target_product ILIKE '%' || LOWER(REPLACE(np.name, ' ', '%')) || '%'
    OR LOWER(SPLIT_PART(uf.target_product, '.', 1)) ILIKE '%' || LOWER(REPLACE(np.name, ' ', '')) || '%'
  );
