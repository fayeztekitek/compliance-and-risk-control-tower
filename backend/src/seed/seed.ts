import { pool } from "../config/database.js";
import { logger } from "../core/logger.js";

async function seed() {
  logger.info("Seeding database...");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Users (from existing MOCK_USERS)
    await client.query(`
      INSERT INTO users (id, name, email, role, status) VALUES
        ('usr-001', 'Fayez Tekitek', 'fayez.tekitek@vermeg.com', 'ADMIN', 'ACTIVE'),
        ('usr-002', 'Amandine Rousset', 'amandine.rousset@vermeg.com', 'COMPLIANCE_OFFICER', 'ACTIVE'),
        ('usr-003', 'Marc-Antoine Dubois', 'm.dubois@vermeg.com', 'RISK_MANAGER', 'ACTIVE'),
        ('usr-004', 'Thomas Lemaire', 't.lemaire@vermeg.com', 'SECURITY_MANAGER', 'ACTIVE'),
        ('usr-005', 'Sarah Laroche', 's.laroche@vermeg.com', 'PRODUCT_OWNER', 'ACTIVE'),
        ('usr-006', 'Julien Mercer', 'j.mercer@vermeg.com', 'AUDITOR', 'ACTIVE'),
        ('usr-007', 'Jean-Pierre Vermeg', 'jp.v@vermeg.com', 'EXECUTIVE_READ_ONLY', 'ACTIVE')
      ON CONFLICT (id) DO NOTHING
    `);

    // Roadmaps (from existing MOCK_ROADMAPS)
    await client.query(`
      INSERT INTO roadmaps (id, name, type, progress, target_date, milestone_status, lead_owner) VALUES
        ('RM-2026-001', 'Palmyra Platform core v8 Upgrade', 'STRATEGIC', 85, '2026-07-15', 'ON_TIME', 'Sarah Laroche'),
        ('RM-2026-002', 'GDPR Cross-Border SaaS Isolation Phase II', 'REGULATORY', 40, '2026-09-30', 'DELAYED', 'Amandine Rousset'),
        ('RM-2026-003', 'Colline Regulatory Cloud Ingress 2026', 'REGULATORY', 95, '2026-06-30', 'ON_TIME', 'Marc-Antoine Dubois'),
        ('RM-2026-004', 'Soliam Pension Scheme API expansion', 'STRATEGIC', 60, '2026-08-31', 'DELAYED', 'Sarah Laroche'),
        ('RM-2026-005', 'FY26 Infrastructure De-risking & Re-platforming', 'BUDGETARY', 15, '2026-12-15', 'CRITICAL', 'Thomas Lemaire')
      ON CONFLICT (id) DO NOTHING
    `);

    // Projects
    await client.query(`
      INSERT INTO projects (id, name, code, manager, initial_budget, consumed_budget, roadmap_id, status, rtd_value, rtd_deviation, slippage_md, test_automation_rate, go_live_readiness_state) VALUES
        ('PRJ-2026-001', 'Colline Integration (BNP Paribas)', 'COLL-BNP', 'Sarah Laroche', 1200, 950, 'RM-2026-003', 'ON_TRACK', 250, 2.5, 15, 78, 'READY'),
        ('PRJ-2026-002', 'Soliam Cloud Migration (Societe Generale)', 'SOLI-SG', 'Robert Martin', 1800, 1550, 'RM-2026-004', 'DEVIATING', 400, 12.8, 45, 55, 'RISKY'),
        ('PRJ-2026-003', 'Palmyra Framework API Gateway Refactor', 'PALM-GW', 'Sarah Laroche', 600, 580, 'RM-2026-001', 'ON_TRACK', 20, 0, 0, 92, 'READY'),
        ('PRJ-2026-004', 'Megara Security Token Registry Setup', 'MEGA-STR', 'Jean Dupont', 950, 890, 'RM-2026-005', 'HIGH_RISK', 210, 26.4, 70, 41, 'BLOCKED'),
        ('PRJ-2026-005', 'Solife Custom Client Portal (Allianz)', 'SOLI-AZ', 'Robert Martin', 1500, 1100, 'RM-2026-004', 'ON_TRACK', 400, 3.1, -10, 82, 'READY'),
        ('PRJ-2026-006', 'DIG Digital Banking Onboarding Suite', 'DIG-ONB', 'Clara Besson', 800, 650, 'RM-2026-001', 'ON_TRACK', 150, -1.2, -5, 88, 'READY'),
        ('PRJ-2026-007', 'Palmyra Mobile Hybrid App upgrade', 'PALM-MOB', 'Clara Besson', 500, 420, 'RM-2026-001', 'DEVIATING', 120, 16.5, 25, 60, 'RISKY'),
        ('PRJ-2026-008', 'Regulatory Reporting engine v12', 'REG-REP12', 'Marc-Antoine Dubois', 750, 720, 'RM-2026-003', 'HIGH_RISK', 90, 22, 35, 48, 'BLOCKED')
      ON CONFLICT (id) DO NOTHING
    `);

    await client.query("COMMIT");
    logger.info("Database seeded successfully");
  } catch (err) {
    await client.query("ROLLBACK");
    logger.error({ err }, "Seed failed");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
