import { query } from "../config/database.js";

export const kpiRegistryService = {
  async list(domain?: string) {
    const cond = domain ? "WHERE domain = $1" : "";
    const params = domain ? [domain] : [];
    const r = await query(`SELECT * FROM kpi_definitions ${cond} ORDER BY domain, name`, params);
    return r.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      formula: row.formula,
      owner: row.owner,
      frequency: row.frequency,
      domain: row.domain,
      unit: row.unit,
      higherIsBetter: row.higher_is_better,
      thresholds: row.thresholds,
      ragRules: row.rag_rules,
      explanation: row.explanation,
      sourceQuery: row.source_query,
      active: row.active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  async getById(id: string) {
    const r = await query("SELECT * FROM kpi_definitions WHERE id = $1", [id]);
    return r.rows.length ? r.rows[0] : null;
  },

  async create(data: any) {
    const r = await query(
      `INSERT INTO kpi_definitions (name, description, formula, owner, frequency, domain, unit, higher_is_better, thresholds, rag_rules, explanation, source_query)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [data.name, data.description || null, data.formula || null, data.owner || null,
       data.frequency || "MONTHLY", data.domain, data.unit || null,
       data.higherIsBetter ?? true, JSON.stringify(data.thresholds || {}),
       JSON.stringify(data.ragRules || []), data.explanation || null, data.sourceQuery || null]
    );
    return r.rows[0];
  },

  async update(id: string, data: any) {
    const fields: string[] = []; const params: any[] = []; let idx = 1;
    const map: Record<string, string> = {
      name: "name", description: "description", formula: "formula",
      owner: "owner", frequency: "frequency", domain: "domain",
      unit: "unit", higherIsBetter: "higher_is_better", explanation: "explanation",
      sourceQuery: "source_query", active: "active",
    };
    for (const [k, c] of Object.entries(map)) { if (data[k] !== undefined) { fields.push(`${c}=$${idx++}`); params.push(data[k]); } }
    if (data.thresholds) { fields.push(`thresholds=$${idx++}`); params.push(JSON.stringify(data.thresholds)); }
    if (data.ragRules) { fields.push(`rag_rules=$${idx++}`); params.push(JSON.stringify(data.ragRules)); }
    if (!fields.length) return null;
    params.push(id);
    const r = await query(`UPDATE kpi_definitions SET ${fields.join(",")} WHERE id=$${idx} RETURNING *`, params);
    return r.rows.length ? r.rows[0] : null;
  },

  async delete(id: string) {
    await query("DELETE FROM kpi_definitions WHERE id = $1", [id]);
  },

  async evaluateRag(name: string, value: number): Promise<"GREEN" | "AMBER" | "RED"> {
    const r = await query("SELECT rag_rules FROM kpi_definitions WHERE name = $1", [name]);
    if (!r.rows.length) return "GREEN";
    const rules: { rule: string; condition: string }[] = r.rows[0].rag_rules || [];
    for (const rule of [...rules].reverse()) {
      try {
        const fn = new Function("value", `return ${rule.condition}`);
        if (fn(value)) return rule.rule as any;
      } catch { /* skip invalid rules */ }
    }
    return "GREEN";
  },
};
