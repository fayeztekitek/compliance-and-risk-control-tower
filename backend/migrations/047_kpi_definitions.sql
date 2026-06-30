-- ============================================================================
-- Migration 047: KPI Definition Registry
-- Centralized metadata for all KPIs across domains
-- ============================================================================

CREATE TABLE kpi_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  formula TEXT,
  owner VARCHAR(255),
  frequency VARCHAR(50) DEFAULT 'MONTHLY',
  domain VARCHAR(100) NOT NULL,
  unit VARCHAR(50),
  higher_is_better BOOLEAN DEFAULT TRUE,
  thresholds JSONB DEFAULT '{}',
  rag_rules JSONB DEFAULT '[]',
  explanation TEXT,
  source_query TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial KPI definitions from existing dashboards
INSERT INTO kpi_definitions (name, description, formula, owner, frequency, domain, unit, higher_is_better, thresholds, rag_rules, explanation) VALUES
('Total Roadmaps', 'Total number of active roadmaps in the portfolio', 'SELECT COUNT(*) FROM roadmaps WHERE deleted_at IS NULL', 'PMO', 'MONTHLY', 'roadmap', 'count', TRUE, '{}', '[{"rule": "GREEN", "condition": "value >= 0"}]', 'High-level count of all roadmaps under management.'),
('Average Progress', 'Average completion progress across all roadmaps', 'SELECT AVG(progress) FROM roadmaps WHERE deleted_at IS NULL', 'PMO', 'MONTHLY', 'roadmap', 'percentage', TRUE, '{"warning": 50, "critical": 25}', '[{"rule": "GREEN", "condition": "value >= 75"}, {"rule": "AMBER", "condition": "value >= 50"}, {"rule": "RED", "condition": "value < 50"}]', 'Tracks whether roadmaps are progressing as planned.'),
('On-Time Roadmaps', 'Roadmaps with milestone_status = ON_TIME', 'SELECT COUNT(*) FROM roadmaps WHERE milestone_status = ''ON_TIME'' AND deleted_at IS NULL', 'PMO', 'MONTHLY', 'roadmap', 'count', TRUE, '{}', '[{"rule": "GREEN", "condition": "value >= 0"}]', 'Number of roadmaps meeting their milestone deadlines.'),
('Total Projects', 'Total active projects across all roadmaps', 'SELECT COUNT(*) FROM projects WHERE deleted_at IS NULL', 'PMO', 'MONTHLY', 'project', 'count', TRUE, '{}', '[{"rule": "GREEN", "condition": "value >= 0"}]', 'Total project count in the portfolio.'),
('On-Track Projects', 'Projects with status = ON_TRACK', 'SELECT COUNT(*) FROM projects WHERE status = ''ON_TRACK'' AND deleted_at IS NULL', 'PMO', 'MONTHLY', 'project', 'count', TRUE, '{}', '[{"rule": "GREEN", "condition": "value >= 0"}]', 'Healthy projects progressing as planned.'),
('Capacity Gap', 'Projects deviating + high risk', 'SELECT COUNT(*) FROM projects WHERE status IN (''DEVIATING'', ''HIGH_RISK'') AND deleted_at IS NULL', 'PMO', 'MONTHLY', 'project', 'count', FALSE, '{"warning": 5, "critical": 10}', '[{"rule": "GREEN", "condition": "value <= 3"}, {"rule": "AMBER", "condition": "value <= 10"}, {"rule": "RED", "condition": "value > 10"}]', 'Number of projects that are off-track and require management attention.'),
('Average RTD', 'Average Resource Time Deviation across projects', 'SELECT AVG(rtd_value) FROM projects WHERE deleted_at IS NULL', 'PMO', 'MONTHLY', 'project', 'days', FALSE, '{"warning": 10, "critical": 20}', '[{"rule": "GREEN", "condition": "value <= 5"}, {"rule": "AMBER", "condition": "value <= 20"}, {"rule": "RED", "condition": "value > 20"}]', 'Average schedule deviation across all projects.'),
('Budget Utilization', 'Percentage of total budget consumed', 'SELECT CASE WHEN SUM(initial_budget) > 0 THEN ROUND((SUM(consumed_budget) / SUM(initial_budget) * 100)::numeric, 1) ELSE 0 END FROM projects WHERE deleted_at IS NULL', 'Finance', 'MONTHLY', 'project', 'percentage', FALSE, '{"warning": 80, "critical": 95}', '[{"rule": "GREEN", "condition": "value <= 75"}, {"rule": "AMBER", "condition": "value <= 95"}, {"rule": "RED", "condition": "value > 95"}]', 'How much of the total allocated budget has been spent.'),
('Overrun Projects', 'Projects where consumed budget exceeds initial budget', 'SELECT COUNT(*) FROM projects WHERE consumed_budget > initial_budget AND deleted_at IS NULL', 'Finance', 'MONTHLY', 'project', 'count', FALSE, '{"warning": 2, "critical": 5}', '[{"rule": "GREEN", "condition": "value = 0"}, {"rule": "AMBER", "condition": "value <= 5"}, {"rule": "RED", "condition": "value > 5"}]', 'Projects that have exceeded their initial budget allocation.'),
('Blocked Projects', 'Projects with go_live_readiness_state = BLOCKED', 'SELECT COUNT(*) FROM projects WHERE go_live_readiness_state = ''BLOCKED'' AND deleted_at IS NULL', 'PMO', 'MONTHLY', 'project', 'count', FALSE, '{"warning": 1, "critical": 3}', '[{"rule": "GREEN", "condition": "value = 0"}, {"rule": "AMBER", "condition": "value <= 3"}, {"rule": "RED", "condition": "value > 3"}]', 'Projects that are blocked from going live.'),
('Test Automation Rate', 'Average test automation coverage across projects', 'SELECT AVG(test_automation_rate) FROM projects WHERE deleted_at IS NULL', 'QA', 'MONTHLY', 'project', 'percentage', TRUE, '{"warning": 50, "critical": 25}', '[{"rule": "GREEN", "condition": "value >= 75"}, {"rule": "AMBER", "condition": "value >= 50"}, {"rule": "RED", "condition": "value < 50"}]', 'Average percentage of test automation across all projects.'),
('Open Risks', 'Total open risks across all projects', 'SELECT COUNT(*) FROM project_risks WHERE status = ''OPEN''', 'Risk', 'MONTHLY', 'risk', 'count', FALSE, '{"warning": 20, "critical": 50}', '[{"rule": "GREEN", "condition": "value <= 10"}, {"rule": "AMBER", "condition": "value <= 50"}, {"rule": "RED", "condition": "value > 50"}]', 'Total unresolved risks requiring attention.'),
('Critical Risks', 'Risks with severity = RED', 'SELECT COUNT(*) FROM project_risks WHERE severity = ''RED'' AND status = ''OPEN''', 'Risk', 'MONTHLY', 'risk', 'count', FALSE, '{"warning": 3, "critical": 8}', '[{"rule": "GREEN", "condition": "value = 0"}, {"rule": "AMBER", "condition": "value <= 8"}, {"rule": "RED", "condition": "value > 8"}]', 'High-severity risks that require immediate executive attention.'),
('Overdue Milestones', 'Milestones past due date and not completed', 'SELECT COUNT(*) FROM project_milestones WHERE due_date < CURRENT_DATE AND status != ''COMPLETED''', 'PMO', 'MONTHLY', 'milestone', 'count', FALSE, '{"warning": 5, "critical": 15}', '[{"rule": "GREEN", "condition": "value <= 2"}, {"rule": "AMBER", "condition": "value <= 15"}, {"rule": "RED", "condition": "value > 15"}]', 'Milestones that have passed their due date without completion.'),
('Snapshots Taken', 'Total roadmap snapshots captured', 'SELECT COUNT(*) FROM roadmap_snapshots', 'PMO', 'MONTHLY', 'snapshot', 'count', TRUE, '{}', '[{"rule": "GREEN", "condition": "value >= 1"}]', 'Total number of roadmap snapshots stored for historical comparison.');
