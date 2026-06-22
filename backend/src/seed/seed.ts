import { randomUUID } from "crypto";
import { pool } from "../config/database.js";
import { logger } from "../core/logger.js";

async function seed() {
  logger.info("Seeding database...");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingCount = (await client.query("SELECT COUNT(*) as c FROM users")).rows[0].c;
    if (parseInt(existingCount, 10) > 0) {
      logger.info("Database already seeded, skipping");
      await client.query("ROLLBACK");
      return;
    }

    const userIds = {
      admin: randomUUID(),
      compliance: randomUUID(),
      risk: randomUUID(),
      security: randomUUID(),
      product: randomUUID(),
      auditor: randomUUID(),
      exec: randomUUID(),
    };

    await client.query(
      `INSERT INTO users (id, name, email, role, status) VALUES
        ($1, 'Fayez Tekitek', 'fayez.tekitek@vermeg.com', 'ADMIN', 'ACTIVE'),
        ($2, 'Amandine Rousset', 'amandine.rousset@vermeg.com', 'COMPLIANCE_OFFICER', 'ACTIVE'),
        ($3, 'Marc-Antoine Dubois', 'm.dubois@vermeg.com', 'RISK_MANAGER', 'ACTIVE'),
        ($4, 'Thomas Lemaire', 't.lemaire@vermeg.com', 'SECURITY_MANAGER', 'ACTIVE'),
        ($5, 'Sarah Laroche', 's.laroche@vermeg.com', 'PRODUCT_OWNER', 'ACTIVE'),
        ($6, 'Julien Mercer', 'j.mercer@vermeg.com', 'AUDITOR', 'ACTIVE'),
        ($7, 'Jean-Pierre Vermeg', 'jp.v@vermeg.com', 'EXECUTIVE_READ_ONLY', 'ACTIVE')
      ON CONFLICT (email) DO NOTHING`,
      [userIds.admin, userIds.compliance, userIds.risk, userIds.security, userIds.product, userIds.auditor, userIds.exec]
    );

    const roadmapIds = { strategic: randomUUID(), regulatory1: randomUUID(), regulatory2: randomUUID(), strategic2: randomUUID(), budgetary: randomUUID() };

    await client.query(
      `INSERT INTO roadmaps (id, name, type, progress, target_date, milestone_status, lead_owner) VALUES
        ($1, 'Palmyra Platform core v8 Upgrade', 'STRATEGIC', 85, '2026-07-15', 'ON_TIME', 'Sarah Laroche'),
        ($2, 'GDPR Cross-Border SaaS Isolation Phase II', 'REGULATORY', 40, '2026-09-30', 'DELAYED', 'Amandine Rousset'),
        ($3, 'Colline Regulatory Cloud Ingress 2026', 'REGULATORY', 95, '2026-06-30', 'ON_TIME', 'Marc-Antoine Dubois'),
        ($4, 'Soliam Pension Scheme API expansion', 'STRATEGIC', 60, '2026-08-31', 'DELAYED', 'Sarah Laroche'),
        ($5, 'FY26 Infrastructure De-risking & Re-platforming', 'BUDGETARY', 15, '2026-12-15', 'CRITICAL', 'Thomas Lemaire')
      ON CONFLICT (id) DO NOTHING`,
      [roadmapIds.strategic, roadmapIds.regulatory1, roadmapIds.regulatory2, roadmapIds.strategic2, roadmapIds.budgetary]
    );

    await client.query(
      `INSERT INTO projects (id, name, code, manager, initial_budget, consumed_budget, roadmap_id, status, rtd_value, rtd_deviation, slippage_md, test_automation_rate, go_live_readiness_state) VALUES
        ($1, 'Colline Integration (BNP Paribas)', 'COLL-BNP', 'Sarah Laroche', 1200, 950, $2, 'ON_TRACK', 250, 2.5, 15, 78, 'READY'),
        ($3, 'Soliam Cloud Migration (Societe Generale)', 'SOLI-SG', 'Robert Martin', 1800, 1550, $4, 'DEVIATING', 400, 12.8, 45, 55, 'RISKY'),
        ($5, 'Palmyra Framework API Gateway Refactor', 'PALM-GW', 'Sarah Laroche', 600, 580, $6, 'ON_TRACK', 20, 0, 0, 92, 'READY'),
        ($7, 'Megara Security Token Registry Setup', 'MEGA-STR', 'Jean Dupont', 950, 890, $8, 'HIGH_RISK', 210, 26.4, 70, 41, 'BLOCKED'),
        ($9, 'Solife Custom Client Portal (Allianz)', 'SOLI-AZ', 'Robert Martin', 1500, 1100, $10, 'ON_TRACK', 400, 3.1, -10, 82, 'READY'),
        ($11, 'DIG Digital Banking Onboarding Suite', 'DIG-ONB', 'Clara Besson', 800, 650, $12, 'ON_TRACK', 150, -1.2, -5, 88, 'READY'),
        ($13, 'Palmyra Mobile Hybrid App upgrade', 'PALM-MOB', 'Clara Besson', 500, 420, $14, 'DEVIATING', 120, 16.5, 25, 60, 'RISKY'),
        ($15, 'Regulatory Reporting engine v12', 'REG-REP12', 'Marc-Antoine Dubois', 750, 720, $16, 'HIGH_RISK', 90, 22, 35, 48, 'BLOCKED')
      ON CONFLICT (code) DO NOTHING`,
      [
        randomUUID(), roadmapIds.regulatory2,
        randomUUID(), roadmapIds.strategic2,
        randomUUID(), roadmapIds.strategic,
        randomUUID(), roadmapIds.budgetary,
        randomUUID(), roadmapIds.strategic2,
        randomUUID(), roadmapIds.strategic,
        randomUUID(), roadmapIds.strategic,
        randomUUID(), roadmapIds.regulatory2,
      ]
    );

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
