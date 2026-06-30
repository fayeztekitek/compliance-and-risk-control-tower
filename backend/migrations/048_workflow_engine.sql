-- ============================================================================
-- Migration 048: Workflow Engine
-- Reusable workflow definitions, instances, and audit trail
-- ============================================================================

CREATE TABLE workflow_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  entity_type VARCHAR(100) NOT NULL,
  states TEXT[] NOT NULL DEFAULT '{}',
  initial_state VARCHAR(100) NOT NULL,
  transitions JSONB DEFAULT '[]',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workflow_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  definition_id UUID NOT NULL REFERENCES workflow_definitions(id),
  entity_id UUID NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  current_state VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  assignee VARCHAR(255),
  due_date DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workflow_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
  from_state VARCHAR(100),
  to_state VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  actor VARCHAR(255),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wf_instances_entity ON workflow_instances(entity_type, entity_id);
CREATE INDEX idx_wf_instances_state ON workflow_instances(current_state);
CREATE INDEX idx_wf_instances_assignee ON workflow_instances(assignee);
CREATE INDEX idx_wf_audit_instance ON workflow_audit_log(instance_id);

-- Seed workflow definitions
INSERT INTO workflow_definitions (name, description, entity_type, states, initial_state, transitions) VALUES
('VEG Request Workflow', 'Governance workflow for VEG (Vulnerability Exception Group) requests', 'veg_request',
  ARRAY['DRAFT','SUBMITTED','PMO_REVIEW','PMO_APPROVED','RISK_REVIEW','RISK_APPROVED','COMEX_REVIEW','COMEX_APPROVED','REJECTED','CLOSED'],
  'DRAFT',
  '[{"from":"DRAFT","to":"SUBMITTED","allowed_roles":["COMPLIANCE_OFFICER"],"label":"Submit"},{"from":"SUBMITTED","to":"PMO_REVIEW","allowed_roles":["ADMIN"],"label":"Assign to PMO"},{"from":"PMO_REVIEW","to":"PMO_APPROVED","allowed_roles":["PRODUCT_OWNER"],"label":"PMO Approve"},{"from":"PMO_REVIEW","to":"REJECTED","allowed_roles":["PRODUCT_OWNER"],"label":"Reject"},{"from":"PMO_APPROVED","to":"RISK_REVIEW","allowed_roles":["ADMIN"],"label":"Forward to Risk"},{"from":"RISK_REVIEW","to":"RISK_APPROVED","allowed_roles":["RISK_MANAGER"],"label":"Risk Approve"},{"from":"RISK_REVIEW","to":"REJECTED","allowed_roles":["RISK_MANAGER"],"label":"Reject"},{"from":"RISK_APPROVED","to":"COMEX_REVIEW","allowed_roles":["ADMIN"],"label":"Forward to COMEX"},{"from":"COMEX_REVIEW","to":"COMEX_APPROVED","allowed_roles":["EXECUTIVE_READ_ONLY"],"label":"COMEX Approve"},{"from":"COMEX_REVIEW","to":"REJECTED","allowed_roles":["EXECUTIVE_READ_ONLY"],"label":"Reject"},{"from":"COMEX_APPROVED","to":"CLOSED","allowed_roles":["ADMIN"],"label":"Close"}]'
),
('Roadmap Review Workflow', 'Periodic review and approval workflow for roadmaps', 'roadmap_review',
  ARRAY['DRAFT','SUBMITTED','REVIEW','APPROVED','REJECTED','ARCHIVED'],
  'DRAFT',
  '[{"from":"DRAFT","to":"SUBMITTED","allowed_roles":["PRODUCT_OWNER"],"label":"Submit"},{"from":"SUBMITTED","to":"REVIEW","allowed_roles":["ADMIN"],"label":"Assign Reviewer"},{"from":"REVIEW","to":"APPROVED","allowed_roles":["PRODUCT_OWNER","RISK_MANAGER"],"label":"Approve"},{"from":"REVIEW","to":"REJECTED","allowed_roles":["PRODUCT_OWNER","RISK_MANAGER"],"label":"Reject"},{"from":"APPROVED","to":"ARCHIVED","allowed_roles":["ADMIN"],"label":"Archive"}]'
),
('Project SteerCo Workflow', 'Steering committee meeting preparation and approval', 'steerco',
  ARRAY['SCHEDULED','PREPARATION','HELD','DECISIONS_PENDING','CLOSED','CANCELLED'],
  'SCHEDULED',
  '[{"from":"SCHEDULED","to":"PREPARATION","allowed_roles":["PRODUCT_OWNER"],"label":"Start Preparation"},{"from":"PREPARATION","to":"HELD","allowed_roles":["ADMIN"],"label":"Mark Held"},{"from":"PREPARATION","to":"CANCELLED","allowed_roles":["PRODUCT_OWNER","ADMIN"],"label":"Cancel"},{"from":"HELD","to":"DECISIONS_PENDING","allowed_roles":["ADMIN"],"label":"Pending Decisions"},{"from":"DECISIONS_PENDING","to":"CLOSED","allowed_roles":["ADMIN"],"label":"Close"},{"from":"HELD","to":"CLOSED","allowed_roles":["ADMIN"],"label":"Close"}]'
),
('Waiver Workflow', 'Risk acceptance and waiver approval process', 'waiver',
  ARRAY['DRAFT','SUBMITTED','RISK_REVIEW','RISK_APPROVED','COMEX_REVIEW','COMEX_APPROVED','REJECTED','EXPIRED'],
  'DRAFT',
  '[{"from":"DRAFT","to":"SUBMITTED","allowed_roles":["COMPLIANCE_OFFICER"],"label":"Submit"},{"from":"SUBMITTED","to":"RISK_REVIEW","allowed_roles":["ADMIN"],"label":"To Risk"},{"from":"RISK_REVIEW","to":"RISK_APPROVED","allowed_roles":["RISK_MANAGER"],"label":"Approve"},{"from":"RISK_REVIEW","to":"REJECTED","allowed_roles":["RISK_MANAGER"],"label":"Reject"},{"from":"RISK_APPROVED","to":"COMEX_REVIEW","allowed_roles":["ADMIN"],"label":"To COMEX"},{"from":"COMEX_REVIEW","to":"COMEX_APPROVED","allowed_roles":["EXECUTIVE_READ_ONLY"],"label":"Approve"},{"from":"COMEX_REVIEW","to":"REJECTED","allowed_roles":["EXECUTIVE_READ_ONLY"],"label":"Reject"},{"from":"COMEX_APPROVED","to":"EXPIRED","allowed_roles":["ADMIN"],"label":"Mark Expired"}]'
),
('Risk Acceptance Workflow', 'Formal risk acceptance process', 'risk_acceptance',
  ARRAY['DRAFT','SUBMITTED','REVIEW','ACCEPTED','REJECTED','REVIEWED'],
  'DRAFT',
  '[{"from":"DRAFT","to":"SUBMITTED","allowed_roles":["RISK_MANAGER"],"label":"Submit"},{"from":"SUBMITTED","to":"REVIEW","allowed_roles":["ADMIN"],"label":"Assign"},{"from":"REVIEW","to":"ACCEPTED","allowed_roles":["RISK_MANAGER","EXECUTIVE_READ_ONLY"],"label":"Accept"},{"from":"REVIEW","to":"REJECTED","allowed_roles":["RISK_MANAGER","EXECUTIVE_READ_ONLY"],"label":"Reject"},{"from":"ACCEPTED","to":"REVIEWED","allowed_roles":["ADMIN"],"label":"Periodic Review"}]'
),
('Audit Workflow', 'Audit lifecycle from planning to closure', 'audit',
  ARRAY['PLANNED','IN_PROGRESS','FIELDWORK','REPORTING','REVIEW','FINDINGS_ISSUED','CLOSED','CANCELLED'],
  'PLANNED',
  '[{"from":"PLANNED","to":"IN_PROGRESS","allowed_roles":["AUDITOR","ADMIN"],"label":"Start Audit"},{"from":"IN_PROGRESS","to":"FIELDWORK","allowed_roles":["AUDITOR"],"label":"Begin Fieldwork"},{"from":"FIELDWORK","to":"REPORTING","allowed_roles":["AUDITOR"],"label":"Draft Report"},{"from":"REPORTING","to":"REVIEW","allowed_roles":["ADMIN"],"label":"Submit for Review"},{"from":"REVIEW","to":"FINDINGS_ISSUED","allowed_roles":["AUDITOR","ADMIN"],"label":"Issue Findings"},{"from":"FINDINGS_ISSUED","to":"CLOSED","allowed_roles":["ADMIN"],"label":"Close Audit"},{"from":"PLANNED","to":"CANCELLED","allowed_roles":["ADMIN"],"label":"Cancel"}]'
);
