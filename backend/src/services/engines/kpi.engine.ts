import { query } from "../../config/database.js";
import { eventBus } from "../../core/events/eventBus.js";
import { storeEvent } from "../../core/events/eventStore.js";
import { logger } from "../../core/logger.js";

class KpiEngine {
  async calculateAndStore(): Promise<void> {
    const startTime = Date.now();
    try {
      const security = await this.calculateSecurityKpis();
      const compliance = await this.calculateComplianceKpis();
      const risk = await this.calculateRiskKpis();
      const governance = await this.calculateGovernanceKpis();
      const veg = await this.calculateVegKpis();
      const saas = await this.calculateSaaSKpis();
      const audit = await this.calculateAuditKpis();

      await this.storeSnapshot({
        ...security, ...compliance, ...risk, ...governance, ...veg, ...saas, ...audit,
      });

      logger.info({ duration: Date.now() - startTime }, "KPI engine snapshot complete");
    } catch (err) {
      logger.error({ err }, "KPI engine calculation failed");
    }
  }

  private async calculateSecurityKpis() {
    const result = await query(`
      SELECT
        COUNT(*)::int AS total_vulnerabilities,
        COUNT(*) FILTER (WHERE severity = 'CRITICAL')::int AS critical_vulns,
        COUNT(*) FILTER (WHERE severity = 'HIGH')::int AS high_vulns,
        COUNT(*) FILTER (WHERE severity = 'MEDIUM')::int AS medium_vulns,
        COUNT(*) FILTER (WHERE status = 'OPEN')::int AS open_vulns,
        COUNT(*) FILTER (WHERE status = 'WAIVED')::int AS waived_vulns,
        COUNT(*) FILTER (WHERE status = 'REMEDIATED')::int AS remediated_vulns,
        ROUND(AVG(EXTRACT(EPOCH FROM (COALESCE(remediated_date, NOW()) - detected_date)) / 86400)::numeric, 1)::float AS avg_remediation_days
      FROM vulnerabilities
    `);
    return result.rows[0] || {};
  }

  private async calculateComplianceKpis() {
    const result = await query(`
      SELECT
        COUNT(*)::int AS total_compliance_controls,
        COUNT(*) FILTER (WHERE status = 'ACTIVE')::int AS active_controls,
        COUNT(*) FILTER (WHERE status = 'BREACHED')::int AS breached_controls
      FROM compliance_classification
    `);
    const sla = await query(`
      SELECT
        COUNT(*)::int AS total_sla_incidents,
        COUNT(*) FILTER (WHERE status = 'OPEN')::int AS open_sla_breaches,
        COUNT(*) FILTER (WHERE status = 'BREACHED')::int AS breached_sla
      FROM sla_incidents
    `);
    return { ...(result.rows[0] || {}), ...(sla.rows[0] || {}) };
  }

  private async calculateRiskKpis() {
    const result = await query(`
      SELECT
        COUNT(*)::int AS total_waivers,
        COUNT(*) FILTER (WHERE status = 'APPROVED')::int AS active_waivers,
        COUNT(*) FILTER (WHERE expiry_date < NOW())::int AS expired_waivers,
        COUNT(*)::int AS total_risk_acceptances
      FROM waivers
    `);
    return result.rows[0] || {};
  }

  private async calculateGovernanceKpis() {
    const roadmaps = await query(`SELECT COUNT(*)::int AS total_roadmaps, ROUND(AVG(progress)::numeric, 1)::float AS avg_roadmap_progress FROM roadmaps`);
    const projects = await query(`
      SELECT COUNT(*)::int AS total_projects,
        ROUND(SUM(consumed_budget)::numeric, 0)::float AS total_consumed_budget,
        ROUND(SUM(initial_budget)::numeric, 0)::float AS total_initial_budget
      FROM projects
    `);
    const committees = await query(`SELECT COUNT(*)::int AS total_committees FROM committees`);
    return { ...(roadmaps.rows[0] || {}), ...(projects.rows[0] || {}), ...(committees.rows[0] || {}) };
  }

  private async calculateVegKpis() {
    const result = await query(`
      SELECT
        COUNT(*)::int AS total_veg_requests,
        COUNT(*) FILTER (WHERE status = 'DRAFT')::int AS draft_veg,
        COUNT(*) FILTER (WHERE status = 'ACTIVE')::int AS active_veg,
        COUNT(*) FILTER (WHERE status = 'APPROVED')::int AS approved_veg
      FROM veg_requests
    `);
    return result.rows[0] || {};
  }

  private async calculateSaaSKpis() {
    const result = await query(`
      SELECT
        COUNT(*)::int AS total_saas_apps,
        COUNT(*) FILTER (WHERE steering_check_passed = true)::int AS saas_steering_passed,
        COUNT(*) FILTER (WHERE lifecycle_stage = 'ONBOARDING')::int AS saas_onboarding,
        COUNT(*) FILTER (WHERE lifecycle_stage = 'GO_LIVE')::int AS saas_go_live,
        ROUND(AVG(go_live_readiness_score)::numeric, 1)::float AS avg_saas_readiness
      FROM saas_applications
    `);
    return result.rows[0] || {};
  }

  private async calculateAuditKpis() {
    const audits = await query(`
      SELECT COUNT(*)::int AS total_audits,
        COUNT(*) FILTER (WHERE status = 'PLANNED')::int AS planned_audits,
        COUNT(*) FILTER (WHERE status = 'IN_PROGRESS')::int AS in_progress_audits,
        COUNT(*) FILTER (WHERE status = 'COMPLETED')::int AS completed_audits
      FROM audits
    `);
    const findings = await query(`
      SELECT COUNT(*)::int AS total_findings,
        COUNT(*) FILTER (WHERE status = 'OPEN')::int AS open_findings,
        COUNT(*) FILTER (WHERE severity = 'CRITICAL')::int AS critical_findings,
        COUNT(*) FILTER (WHERE severity = 'HIGH')::int AS high_findings
      FROM audit_findings
    `);
    return { ...(audits.rows[0] || {}), ...(findings.rows[0] || {}) };
  }

  private async storeSnapshot(kpis: Record<string, any>): Promise<void> {
    const columnNames = Object.keys(kpis).filter((k) => kpis[k] != null);
    const values = columnNames.map((k) => kpis[k]);
    const placeholders = values.map((_, i) => `$${i + 2}`).join(", ");

    await query(`
      INSERT INTO nexus_kpi_snapshots (source, ${columnNames.join(", ")})
      VALUES ($1, ${placeholders})
    `, ["ENGINE", ...values]);

    await storeEvent({
      eventType: "kpi.snapshot.stored",
      aggregateType: "kpi",
      aggregateId: "system",
      data: { kpiCount: columnNames.length },
    });
  }

  async getLatestSnapshot() {
    const result = await query(`
      SELECT * FROM nexus_kpi_snapshots
      ORDER BY created_at DESC LIMIT 1
    `);
    return result.rows[0] || null;
  }

  async getKpiDefinitions() {
    const result = await query(`SELECT * FROM kpi_definitions ORDER BY category, name`);
    return result.rows;
  }

  async getKriDefinitions() {
    const result = await query(`SELECT * FROM kri_definitions ORDER BY category, name`);
    return result.rows;
  }

  async triggerRecalculation(): Promise<void> {
    await eventBus.publish({
      eventType: "kpi.recalculate.requested",
      aggregateType: "kpi",
      aggregateId: "system",
      data: { triggeredAt: new Date().toISOString() },
    });
    await this.calculateAndStore();
  }
}

export const kpiEngine = new KpiEngine();
