-- Sprint 13: Archive + Performance + Partition Infrastructure
-- Migration 028
-- NOTE: Native partitioning blocked by FK constraints referencing unified_findings(id) alone.
-- Instead we create an archive table + partition maintenance infrastructure.
-- Future: when table exceeds 1M rows, migrate to table inheritance partitioning.

BEGIN;

-- ==============================
-- 1. findings_archive table
-- ==============================
CREATE TABLE IF NOT EXISTS findings_archive (
    id              uuid                    NOT NULL,
    created_at      timestamp with time zone NOT NULL,
    updated_at      timestamp with time zone,
    source_tool     finding_source          NOT NULL,
    source_id       character varying(255),
    source_table    character varying(50),
    product_id      uuid,
    application_id  uuid,
    target_product  character varying(255),
    title           text                    NOT NULL,
    description     text,
    unified_severity severity               NOT NULL,
    native_severity character varying(50),
    cvss_score      numeric(3,1),
    cvss_vector     character varying(255),
    cve_id          character varying(20),
    cwe_id          character varying(20),
    status          unified_finding_status  NOT NULL DEFAULT 'OPEN',
    remediation     text,
    fix_available   boolean                 DEFAULT false,
    recommended_version character varying(100),
    detected_date   date                    NOT NULL,
    remediated_date date,
    sla_due_date    date,
    epss_score      numeric(6,5)            DEFAULT 0,
    cisa_kev        boolean                 DEFAULT false,
    risk_score      numeric(5,2),
    component_name  character varying(255),
    component_version character varying(100),
    package_url     text,
    dependency_type dependency_type,
    reachability    reachability,
    exploitability  exploitability,
    age_in_days     integer                 DEFAULT 0,
    first_seen_date date,
    last_seen_date  date,
    scan_id         character varying(100),
    regulatory_tags regulatory_framework[]  DEFAULT '{}',
    pii_impact      boolean                 DEFAULT false,
    waiver_id       uuid,
    risk_acceptance_id uuid,
    audit_finding_id uuid,
    deleted_at      timestamp with time zone,
    metadata        jsonb,
    mitigation_id   uuid,
    archived_at     timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE INDEX idx_archive_created_at ON findings_archive (created_at DESC);
CREATE INDEX idx_archive_source ON findings_archive (source_tool);
CREATE INDEX idx_archive_severity ON findings_archive (unified_severity);
CREATE INDEX idx_archive_cve ON findings_archive (cve_id);

-- ==============================
-- 2. Partition maintenance function
-- ==============================
CREATE OR REPLACE FUNCTION create_future_partition()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    next_month date;
    partition_name text;
    start_date text;
    end_date text;
BEGIN
    next_month := date_trunc('month', now() + interval '1 month')::date;
    partition_name := 'unified_findings_' || to_char(next_month, 'YYYY_MM');
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = partition_name) THEN
        start_date := to_char(next_month, 'YYYY-MM-DD');
        end_date := to_char(next_month + interval '1 month', 'YYYY-MM-DD');
        EXECUTE format(
            'CREATE TABLE %I (LIKE unified_findings INCLUDING ALL) INHERITS (unified_findings)',
            partition_name
        );
        EXECUTE format(
            'ALTER TABLE %I ADD CONSTRAINT %s CHECK (created_at >= %L AND created_at < %L)',
            partition_name,
            partition_name || '_created_at_check',
            start_date,
            end_date
        );
    END IF;
END;
$$;

-- ==============================
-- 3. Create initial future partition
-- ==============================
SELECT create_future_partition();

-- ==============================
-- 4. Performance indexes
-- ==============================
-- Performance indexes (new)
CREATE INDEX IF NOT EXISTS idx_uf_created_at_desc ON unified_findings (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uf_fulltext ON unified_findings USING gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));
CREATE INDEX IF NOT EXISTS idx_vul_created_at ON vulnerabilities (created_at DESC);

COMMIT;
