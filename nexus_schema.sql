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
    vulnerability_id VARCHAR(100) NOT NULL, -- e.g. CVE-2026-0034
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

-- 10. Table: Nexus KPI Snapshots
CREATE TABLE nexus_kpi_snapshots (
    id VARCHAR(100) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source_system VARCHAR(100) NOT NULL,
    sync_batch_id VARCHAR(100) NOT NULL,
    snapshot_date DATE NOT NULL,
    global_security_risk_score NUMERIC(5,2) NOT NULL,
    total_vulnerabilities INT DEFAULT 0,
    critical_vulnerabilities INT DEFAULT 0,
    high_vulnerabilities INT DEFAULT 0,
    new_vulnerabilities INT DEFAULT 0,
    fixed_vulnerabilities INT DEFAULT 0,
    accepted_risk_count INT DEFAULT 0,
    expired_waivers_count INT DEFAULT 0,
    products_red_count INT DEFAULT 0,
    products_orange_count INT DEFAULT 0,
    products_green_count INT DEFAULT 0,
    security_debt_score INT DEFAULT 0,
    compliance_score NUMERIC(5,2) DEFAULT 100.00
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

-- 12. Table: Nexus Sync Logs
CREATE TABLE nexus_sync_logs (
    id VARCHAR(100) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    source_system VARCHAR(100) NOT NULL,
    sync_batch_id VARCHAR(100) NOT NULL,
    batch_id VARCHAR(100) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    executed_by VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('SUCCESS', 'FAILED', 'WARNING')),
    summary TEXT,
    logs TEXT, -- Complete technical logs with tokens masked
    retry_count INT DEFAULT 0,
    target_url TEXT NOT NULL
);

-- ============================================================================
-- PERFORMANCE CRITICAL INDEXES (As specified in requirement details)
-- ============================================================================

-- 1. Index on product_id fields
CREATE INDEX idx_products_pid ON products(product_id);
CREATE INDEX idx_mapping_pid ON product_application_mapping(product_id);
CREATE INDEX idx_violations_pid ON nexus_policy_violations(product_mapping);
CREATE INDEX idx_waivers_pid ON nexus_waivers(product_id);
CREATE INDEX idx_alerts_pid ON nexus_alerts(product_id);

-- 2. Index on application_id fields
CREATE INDEX idx_apps_aid ON nexus_applications(application_id);
CREATE INDEX idx_mapping_aid ON product_application_mapping(application_id);
CREATE INDEX idx_scans_aid ON nexus_scan_reports(application_id);
CREATE INDEX idx_vulns_aid ON nexus_vulnerabilities(application_id);
CREATE INDEX idx_violations_aid ON nexus_policy_violations(application_id);
CREATE INDEX idx_waivers_aid ON nexus_waivers(application_id);
CREATE INDEX idx_alerts_aid ON nexus_alerts(application_id);

-- 3. Index on scan_id fields
CREATE INDEX idx_scans_sid ON nexus_scan_reports(scan_id);
CREATE INDEX idx_vulns_sid ON nexus_vulnerabilities(scan_id);

-- 4. Index on severity fields
CREATE INDEX idx_vulns_severity ON nexus_vulnerabilities(severity);

-- 5. Index on status fields
CREATE INDEX idx_vulns_status ON nexus_vulnerabilities(status);
CREATE INDEX idx_violations_status ON nexus_policy_violations(status);
CREATE INDEX idx_waivers_status ON nexus_waivers(status);
CREATE INDEX idx_sync_status ON nexus_sync_logs(status);

-- 6. Index on created_date / first_seen_date
CREATE INDEX idx_vulns_first_seen ON nexus_vulnerabilities(first_seen_date);
CREATE INDEX idx_violations_created_date ON nexus_policy_violations(created_date);
CREATE INDEX idx_waivers_created_date ON nexus_waivers(creation_date);

-- 7. Index on expiration_date 
CREATE INDEX idx_waivers_expiration_date ON nexus_waivers(expiration_date);
