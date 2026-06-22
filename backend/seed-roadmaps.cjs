const { Pool } = require('pg');
const { randomUUID } = require('crypto');

async function main() {
  const pool = new Pool({ host: 'localhost', port: 5432, database: 'compliance_tower', user: 'postgres', password: 'postgres' });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const r = [randomUUID(), randomUUID(), randomUUID(), randomUUID(), randomUUID()];
    await client.query(
      `INSERT INTO roadmaps (id, name, type, progress, target_date, milestone_status, lead_owner) VALUES
        ($1, 'Palmyra Platform core v8 Upgrade', 'STRATEGIC', 85, '2026-07-15', 'ON_TIME', 'Sarah Laroche'),
        ($2, 'GDPR Cross-Border SaaS Isolation Phase II', 'REGULATORY', 40, '2026-09-30', 'DELAYED', 'Amandine Rousset'),
        ($3, 'Colline Regulatory Cloud Ingress 2026', 'REGULATORY', 95, '2026-06-30', 'ON_TIME', 'Marc-Antoine Dubois'),
        ($4, 'Soliam Pension Scheme API expansion', 'STRATEGIC', 60, '2026-08-31', 'DELAYED', 'Sarah Laroche'),
        ($5, 'FY26 Infrastructure De-risking & Re-platforming', 'BUDGETARY', 15, '2026-12-15', 'CRITICAL', 'Thomas Lemaire')
      ON CONFLICT (id) DO NOTHING`,
      r
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
      [randomUUID(), r[2], randomUUID(), r[3], randomUUID(), r[0], randomUUID(), r[4], randomUUID(), r[3], randomUUID(), r[0], randomUUID(), r[0], randomUUID(), r[2]]
    );
    await client.query("COMMIT");
    console.log('Roadmaps and projects seeded');
  } catch (e) {
    await client.query("ROLLBACK");
    console.error('Failed:', e.message);
  } finally {
    client.release();
  }
  const rm = await pool.query("SELECT count(*)::int as c FROM roadmaps");
  const pr = await pool.query("SELECT count(*)::int as c FROM projects");
  console.log('Roadmaps:', rm.rows[0].c, 'Projects:', pr.rows[0].c);
  await pool.end();
}
main();
