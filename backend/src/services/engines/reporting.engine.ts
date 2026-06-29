import { query } from "../../config/database.js";
import { logger } from "../../core/logger.js";
import { writeFile } from "fs/promises";
import { join } from "path";
import { env } from "../../config/env.js";
import { eventBus } from "../../core/events/eventBus.js";

interface ReportConfig {
  sections: ReportSection[];
  filters?: Record<string, any>;
}

interface ReportSection {
  title: string;
  type: "kpi_summary" | "table" | "chart_data";
  dataSource?: string;
  query?: string;
}

class ReportingEngine {
  async createTemplate(params: {
    name: string;
    description?: string;
    config: ReportConfig;
  }): Promise<string> {
    const result = await query(`
      INSERT INTO report_templates (name, description, config)
      VALUES ($1, $2, $3)
      RETURNING id
    `, [params.name, params.description || null, JSON.stringify(params.config)]);
    return result.rows[0].id;
  }

  async generateReport(params: {
    templateId?: string;
    templateName?: string;
    name: string;
    format: "CSV" | "PDF" | "XLSX" | "HTML";
    params?: Record<string, any>;
  }): Promise<{ id: string; status: string }> {
    let templateId = params.templateId;
    if (!templateId && params.templateName) {
      const result = await query(`SELECT id FROM report_templates WHERE name = $1`, [params.templateName]);
      if (result.rows.length) templateId = result.rows[0].id;
    }

    const instance = await query(`
      INSERT INTO report_instances (template_id, name, format, params, status)
      VALUES ($1, $2, $3, $4, 'GENERATING')
      RETURNING id
    `, [templateId || null, params.name, params.format, JSON.stringify(params.params || {})]);

    const instanceId = instance.rows[0].id;
    try {
      const content = await this.buildContent(params.name, params.format, params.params || {});
      const reportDir = join(env.REPORT_DIR || "/tmp/reports");
      const filePath = join(reportDir, `${params.name.replace(/\s+/g, "-")}-${Date.now()}.${params.format.toLowerCase()}`);
      await writeFile(filePath, content, "utf-8");

      await query(`
        UPDATE report_instances SET status = 'COMPLETED', file_path = $1, generated_at = NOW()
        WHERE id = $2
      `, [filePath, instanceId]);

      await eventBus.publish({
        eventType: "report.generated",
        aggregateType: "report",
        aggregateId: instanceId,
        data: { name: params.name, format: params.format, filePath },
      });

      return { id: instanceId, status: "COMPLETED" };
    } catch (err: any) {
      await query(`
        UPDATE report_instances SET status = 'FAILED', error_message = $1 WHERE id = $2
      `, [err.message, instanceId]);
      return { id: instanceId, status: "FAILED" };
    }
  }

  private async buildContent(name: string, format: string, reportParams: Record<string, any>): Promise<string> {
    if (format === "HTML") {
      return this.buildHtml(name, reportParams);
    }
    if (format === "CSV") {
      return this.buildCsv(reportParams);
    }
    return `Report: ${name}\nFormat: ${format}\nGenerated: ${new Date().toISOString()}\n`;
  }

  private async buildHtml(name: string, reportParams: Record<string, any>): Promise<string> {
    const sections = reportParams.sections as ReportSection[] | undefined;
    let bodyHtml = "";
    if (sections) {
      for (const section of sections) {
        bodyHtml += `<h2>${section.title}</h2>`;
        if (section.type === "kpi_summary") {
          bodyHtml += `<p>KPI summary section (data source: ${section.dataSource || "N/A"})</p>`;
        } else if (section.type === "table" && section.query) {
          try {
            const result = await query(section.query);
            if (result.rows.length) {
              bodyHtml += `<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%">`;
              bodyHtml += `<tr>${Object.keys(result.rows[0]).map((k) => `<th style="background:#f1f5f9;text-align:left">${k}</th>`).join("")}</tr>`;
              for (const row of result.rows) {
                bodyHtml += `<tr>${Object.values(row).map((v) => `<td>${v ?? ""}</td>`).join("")}</tr>`;
              }
              bodyHtml += `</table>`;
            }
          } catch (err) {
            bodyHtml += `<p style="color:red">Query failed: ${(err as Error).message}</p>`;
          }
        }
      }
    }
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${name}</title></head>
      <body style="font-family:sans-serif;padding:20px;color:#1e293b">
        <h1 style="color:#6366f1;border-bottom:2px solid #6366f1;padding-bottom:8px">${name}</h1>
        <p style="color:#64748b">Generated: ${new Date().toLocaleString()}</p>
        ${bodyHtml}
        <hr style="margin-top:40px;border-color:#e2e8f0">
        <p style="font-size:12px;color:#94a3b8">Compliance Control Tower - Automated Report</p>
      </body></html>`;
  }

  private async buildCsv(reportParams: Record<string, any>): Promise<string> {
    const customQuery = reportParams.query as string | undefined;
    if (!customQuery) return "No data";
    try {
      const result = await query(customQuery);
      if (!result.rows.length) return "No data";
      const headers = Object.keys(result.rows[0]);
      const lines = [
        headers.join(","),
        ...result.rows.map((row: any) =>
          headers.map((h) => {
            const val = row[h];
            const str = val == null ? "" : String(val);
            return str.includes(",") ? `"${str}"` : str;
          }).join(",")
        ),
      ];
      return lines.join("\n");
    } catch (err) {
      return `Error: ${(err as Error).message}`;
    }
  }

  async getReportStatus(instanceId: string) {
    const result = await query(`
      SELECT id, name, format, status, file_path, error_message, created_at, generated_at
      FROM report_instances WHERE id = $1
    `, [instanceId]);
    return result.rows[0] || null;
  }

  async listReports(limit = 20, offset = 0) {
    const result = await query(`
      SELECT id, name, format, status, created_at, generated_at
      FROM report_instances
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    return result.rows;
  }
}

export const reportingEngine = new ReportingEngine();
