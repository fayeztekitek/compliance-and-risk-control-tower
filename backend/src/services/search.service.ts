import { query } from "../config/database.js";

export interface SearchResult {
  type: string;
  id: string;
  label: string;
  sublabel: string;
  path: string;
  badge?: string;
}

export async function globalSearch(q: string, limit = 8): Promise<SearchResult[]> {
  const term = `%${q}%`;
  const results: SearchResult[] = [];

  // VEG Deals
  const deals = await query(
    `SELECT veg_id AS id, client AS label, opportunity_crm AS sublabel, decision AS badge
     FROM veg_deals
     WHERE client ILIKE $1 OR veg_id ILIKE $1 OR opportunity_crm ILIKE $1 OR business_owner ILIKE $1
     LIMIT $2`,
    [term, limit]
  );
  for (const r of deals.rows) {
    results.push({ type: "VEG Deal", id: r.id, label: r.label, sublabel: r.sublabel || "", path: `/veg/deal/${r.id}`, badge: r.badge });
  }

  // VEG Requests
  const vegs = await query(
    `SELECT id::text, title, client FROM veg_requests
     WHERE title ILIKE $1 OR client ILIKE $1
     LIMIT $2`,
    [term, limit]
  );
  for (const r of vegs.rows) {
    results.push({ type: "VEG Request", id: r.id, label: r.title, sublabel: r.client || "", path: `/veg/workflow?id=${r.id}` });
  }

  // Vulnerabilities
  const vulns = await query(
    `SELECT id::text, title, target_product FROM vulnerabilities
     WHERE title ILIKE $1 OR target_product ILIKE $1
     LIMIT $2`,
    [term, limit]
  );
  for (const r of vulns.rows) {
    results.push({ type: "Vulnerability", id: r.id, label: r.title, sublabel: r.target_product || "", path: `/vulnerabilities?id=${r.id}` });
  }

  // Unified Findings (Nexus)
  const findings = await query(
    `SELECT id::text, title, cve_id, component_name FROM unified_findings
     WHERE title ILIKE $1 OR cve_id ILIKE $1 OR component_name ILIKE $1
     LIMIT $2`,
    [term, limit]
  );
  for (const r of findings.rows) {
    results.push({ type: "CVE", id: r.id, label: r.cve_id || r.title, sublabel: r.component_name || "", path: `/nexus/vuln/${r.id}`, badge: r.cve_id });
  }

  // Projects
  const projects = await query(
    `SELECT id::text, name, code FROM projects
     WHERE name ILIKE $1 OR code ILIKE $1
     LIMIT $2`,
    [term, limit]
  );
  for (const r of projects.rows) {
    results.push({ type: "Project", id: r.id, label: r.name, sublabel: r.code || "", path: `/roadmaps?id=${r.id}` });
  }

  // Organizations
  const orgs = await query(
    `SELECT id::text, name FROM organizations
     WHERE name ILIKE $1
     LIMIT $2`,
    [term, limit]
  );
  for (const r of orgs.rows) {
    results.push({ type: "Organization", id: r.id, label: r.name, sublabel: "", path: `/organizations?id=${r.id}` });
  }

  // Applications
  const apps = await query(
    `SELECT id::text, name FROM applications
     WHERE name ILIKE $1
     LIMIT $2`,
    [term, limit]
  );
  for (const r of apps.rows) {
    results.push({ type: "Application", id: r.id, label: r.name, sublabel: "", path: `/applications?id=${r.id}` });
  }

  // Audits
  const audits = await query(
    `SELECT id::text, title FROM audits
     WHERE title ILIKE $1
     LIMIT $2`,
    [term, limit]
  );
  for (const r of audits.rows) {
    results.push({ type: "Audit", id: r.id, label: r.title, sublabel: "", path: `/audits?id=${r.id}` });
  }

  // Committees
  const committees = await query(
    `SELECT id::text, name FROM committees
     WHERE name ILIKE $1
     LIMIT $2`,
    [term, limit]
  );
  for (const r of committees.rows) {
    results.push({ type: "Committee", id: r.id, label: r.name, sublabel: "", path: `/committees?id=${r.id}` });
  }

  // SaaS Applications
  const saas = await query(
    `SELECT id::text, name FROM saas_applications
     WHERE name ILIKE $1
     LIMIT $2`,
    [term, limit]
  );
  for (const r of saas.rows) {
    results.push({ type: "SaaS", id: r.id, label: r.name, sublabel: "", path: `/saas?id=${r.id}` });
  }

  // Users
  const users = await query(
    `SELECT id::text, name, email FROM users
     WHERE name ILIKE $1 OR email ILIKE $1
     LIMIT $2`,
    [term, limit]
  );
  for (const r of users.rows) {
    results.push({ type: "User", id: r.id, label: r.name, sublabel: r.email || "", path: `/admin` });
  }

  return results.slice(0, limit * 2);
}
