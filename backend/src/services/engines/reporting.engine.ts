import { query } from "../../config/database.js";
import { logger } from "../../core/logger.js";
import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { existsSync } from "fs";
import { env } from "../../config/env.js";
import { eventBus } from "../../core/events/eventBus.js";
import { emailService } from "../email.service.js";
import * as XLSX from "xlsx";

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

function templateRow(r: any) {
  return {
    id: r.id, createdAt: r.created_at, updatedAt: r.updated_at,
    name: r.name, description: r.description,
    config: typeof r.config === "string" ? JSON.parse(r.config) : r.config,
    enabled: r.enabled,
  };
}

function scheduleRow(r: any) {
  return {
    id: r.id, createdAt: r.created_at, updatedAt: r.updated_at,
    templateId: r.template_id, name: r.name, description: r.description,
    cron: r.cron, format: r.format,
    params: typeof r.params === "string" ? JSON.parse(r.params) : r.params,
    recipients: r.recipients || [], channels: r.channels || [],
    isEnabled: r.is_enabled, lastRunAt: r.last_run_at, nextRunAt: r.next_run_at,
  };
}

function instanceRow(r: any) {
  return {
    id: r.id, createdAt: r.created_at, templateId: r.template_id,
    name: r.name, format: r.format,
    params: typeof r.params === "string" ? JSON.parse(r.params) : r.params,
    status: r.status, filePath: r.file_path, errorMessage: r.error_message,
    generatedAt: r.generated_at,
  };
}

async function ensureReportDir() {
  const dir = env.REPORT_DIR;
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
  return dir;
}

class ReportingEngine {
  // --- Template CRUD ---
  async createTemplate(params: { name: string; description?: string; config: ReportConfig }): Promise<string> {
    const result = await query(
      `INSERT INTO report_templates (name, description, config) VALUES ($1, $2, $3) RETURNING id`,
      [params.name, params.description || null, JSON.stringify(params.config)]
    );
    return result.rows[0].id;
  }

  async listTemplates() {
    const result = await query("SELECT * FROM report_templates ORDER BY name");
    return result.rows.map(templateRow);
  }

  async getTemplate(id: string) {
    const result = await query("SELECT * FROM report_templates WHERE id = $1", [id]);
    if (!result.rows.length) return null;
    return templateRow(result.rows[0]);
  }

  async updateTemplate(id: string, params: { name?: string; description?: string; config?: ReportConfig }) {
    const fields: string[] = [];
    const vals: any[] = [];
    let idx = 1;
    if (params.name !== undefined) { fields.push(`name = $${idx++}`); vals.push(params.name); }
    if (params.description !== undefined) { fields.push(`description = $${idx++}`); vals.push(params.description); }
    if (params.config !== undefined) { fields.push(`config = $${idx++}`); vals.push(JSON.stringify(params.config)); }
    if (!fields.length) return null;
    fields.push("updated_at = NOW()");
    vals.push(id);
    const result = await query(`UPDATE report_templates SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`, vals);
    if (!result.rows.length) return null;
    return templateRow(result.rows[0]);
  }

  async deleteTemplate(id: string) {
    await query("DELETE FROM report_templates WHERE id = $1", [id]);
  }

  // --- Schedule CRUD ---
  async createSchedule(params: {
    templateId?: string; name: string; description?: string;
    cron: string; format?: string; params?: Record<string, any>;
    recipients?: string[]; channels?: string[];
  }) {
    const result = await query(
      `INSERT INTO report_schedules (template_id, name, description, cron, format, params, recipients, channels)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [params.templateId || null, params.name, params.description || null,
       params.cron, params.format || "HTML", JSON.stringify(params.params || {}),
       params.recipients || [], params.channels || ["EMAIL"]]
    );
    return scheduleRow(result.rows[0]);
  }

  async listSchedules() {
    const result = await query("SELECT * FROM report_schedules ORDER BY name");
    return result.rows.map(scheduleRow);
  }

  async getSchedule(id: string) {
    const result = await query("SELECT * FROM report_schedules WHERE id = $1", [id]);
    if (!result.rows.length) return null;
    return scheduleRow(result.rows[0]);
  }

  async updateSchedule(id: string, params: Partial<{
    templateId: string; name: string; description: string;
    cron: string; format: string; params: Record<string, any>;
    recipients: string[]; channels: string[]; isEnabled: boolean;
  }>) {
    const fields: string[] = [];
    const vals: any[] = [];
    let idx = 1;
    if (params.templateId !== undefined) { fields.push(`template_id = $${idx++}`); vals.push(params.templateId); }
    if (params.name !== undefined) { fields.push(`name = $${idx++}`); vals.push(params.name); }
    if (params.description !== undefined) { fields.push(`description = $${idx++}`); vals.push(params.description); }
    if (params.cron !== undefined) { fields.push(`cron = $${idx++}`); vals.push(params.cron); }
    if (params.format !== undefined) { fields.push(`format = $${idx++}`); vals.push(params.format); }
    if (params.params !== undefined) { fields.push(`params = $${idx++}`); vals.push(JSON.stringify(params.params)); }
    if (params.recipients !== undefined) { fields.push(`recipients = $${idx++}`); vals.push(params.recipients); }
    if (params.channels !== undefined) { fields.push(`channels = $${idx++}`); vals.push(params.channels); }
    if (params.isEnabled !== undefined) { fields.push(`is_enabled = $${idx++}`); vals.push(params.isEnabled); }
    if (!fields.length) return null;
    fields.push("updated_at = NOW()");
    vals.push(id);
    const result = await query(`UPDATE report_schedules SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`, vals);
    if (!result.rows.length) return null;
    return scheduleRow(result.rows[0]);
  }

  async deleteSchedule(id: string) {
    await query("DELETE FROM report_schedules WHERE id = $1", [id]);
  }

  async getDueSchedules() {
    const result = await query(
      `SELECT * FROM report_schedules WHERE is_enabled = true AND (next_run_at IS NULL OR next_run_at <= NOW())`
    );
    return result.rows.map(scheduleRow);
  }

  async updateScheduleRunTimes(id: string, nextRunAt: string | null) {
    await query(
      `UPDATE report_schedules SET last_run_at = NOW(), next_run_at = $1, updated_at = NOW() WHERE id = $2`,
      [nextRunAt, id]
    );
  }

  // --- Distribution ---
  async distributeReport(instanceId: string, channels: string[], recipients: string[], filePath?: string) {
    const instance = instanceRow((await query("SELECT * FROM report_instances WHERE id = $1", [instanceId])).rows[0]);
    if (!instance) return;

    for (const recipient of recipients) {
      for (const channel of channels) {
        let status = "SENT";
        let errorMsg: string | null = null;
        try {
          if (channel === "EMAIL") {
            const attachments: any[] = [];
            if (filePath && existsSync(filePath)) {
              attachments.push({ path: filePath, filename: `${instance.name}.${instance.format.toLowerCase()}` });
            }
            await emailService.sendReport({
              to: [recipient],
              subject: `Report: ${instance.name}`,
              title: `Report Generated: ${instance.name}`,
              bodyLines: [`Format: ${instance.format}`, `Generated: ${new Date().toISOString()}`],
              attachments,
            });
          }
        } catch (err: any) {
          status = "FAILED";
          errorMsg = err.message;
        }
        await query(
          `INSERT INTO report_distribution_log (instance_id, channel, recipient, status, error_message, delivered_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [instanceId, channel, recipient, status, errorMsg, status === "SENT" ? new Date().toISOString() : null]
        );
      }
    }
  }

  async getDistributionLogs(instanceId: string) {
    const result = await query(
      "SELECT * FROM report_distribution_log WHERE instance_id = $1 ORDER BY created_at DESC",
      [instanceId]
    );
    return result.rows;
  }

  // --- Report Generation ---
  async generateReport(params: {
    templateId?: string; templateName?: string;
    name: string; format: "CSV" | "PDF" | "XLSX" | "HTML";
    params?: Record<string, any>;
    channels?: string[]; recipients?: string[];
  }): Promise<{ id: string; status: string; filePath?: string }> {
    let templateId = params.templateId;
    if (!templateId && params.templateName) {
      const result = await query("SELECT id FROM report_templates WHERE name = $1", [params.templateName]);
      if (result.rows.length) templateId = result.rows[0].id;
    }

    const instance = await query(
      `INSERT INTO report_instances (template_id, name, format, params, status)
       VALUES ($1, $2, $3, $4, 'GENERATING') RETURNING *`,
      [templateId || null, params.name, params.format, JSON.stringify(params.params || {})]
    );
    const instanceId = instance.rows[0].id;

    try {
      const dir = await ensureReportDir();
      const ext = params.format.toLowerCase();
      const fileName = `${params.name.replace(/\s+/g, "-")}-${Date.now()}.${ext}`;
      const filePath = join(dir, fileName);

      if (params.format === "XLSX") {
        await this.buildXlsx(params.name, params.params || {}, filePath);
      } else if (params.format === "CSV") {
        const content = await this.buildCsv(params.params || {});
        await writeFile(filePath, content, "utf-8");
      } else {
        const content = await this.buildHtml(params.name, params.params || {});
        const htmlPath = params.format === "PDF" ? filePath.replace(/\.pdf$/i, ".html") : filePath;
        await writeFile(htmlPath, content, "utf-8");
        if (params.format === "PDF") {
          await writeFile(filePath, content, "utf-8");
        }
      }

      await query(
        `UPDATE report_instances SET status = 'COMPLETED', file_path = $1, generated_at = NOW() WHERE id = $2`,
        [filePath, instanceId]
      );

      await eventBus.publish({
        eventType: "report.generated",
        aggregateType: "report",
        aggregateId: instanceId,
        data: { name: params.name, format: params.format, filePath },
      });

      if (params.channels?.length && params.recipients?.length) {
        await this.distributeReport(instanceId, params.channels, params.recipients, filePath);
      }

      return { id: instanceId, status: "COMPLETED", filePath };
    } catch (err: any) {
      await query(
        `UPDATE report_instances SET status = 'FAILED', error_message = $1 WHERE id = $2`,
        [err.message, instanceId]
      );
      return { id: instanceId, status: "FAILED" };
    }
  }

  async getReportStatus(instanceId: string) {
    const result = await query("SELECT * FROM report_instances WHERE id = $1", [instanceId]);
    if (!result.rows.length) return null;
    return instanceRow(result.rows[0]);
  }

  async listReports(limit = 20, offset = 0) {
    const result = await query(
      "SELECT * FROM report_instances ORDER BY created_at DESC LIMIT $1 OFFSET $2",
      [limit, offset]
    );
    return result.rows.map(instanceRow);
  }

  // --- Builders ---
  private async buildXlsx(name: string, reportParams: Record<string, any>, filePath: string) {
    const wb = XLSX.utils.book_new();
    const sections = reportParams.sections as ReportSection[] | undefined;

    if (sections) {
      for (const section of sections) {
        if (section.type === "table" && section.query) {
          try {
            const result = await query(section.query);
            if (result.rows.length) {
              const ws = XLSX.utils.json_to_sheet(result.rows);
              XLSX.utils.book_append_sheet(wb, ws, section.title.slice(0, 31));
            }
          } catch (err) {
            logger.warn({ err, section: section.title }, "XLSX section query failed");
          }
        }
      }
    }

    const customQuery = reportParams.query as string | undefined;
    if (customQuery && !sections) {
      try {
        const result = await query(customQuery);
        if (result.rows.length) {
          const ws = XLSX.utils.json_to_sheet(result.rows);
          XLSX.utils.book_append_sheet(wb, ws, "Data");
        }
      } catch (err) {
        logger.warn({ err }, "XLSX query failed");
      }
    }

    if (wb.SheetNames.length === 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["No data"]]), "Data");
    }

    XLSX.writeFile(wb, filePath);
  }

  private async buildHtml(name: string, reportParams: Record<string, any>): Promise<string> {
    const sections = reportParams.sections as ReportSection[] | undefined;
    let bodyHtml = "";

    if (sections) {
      for (const section of sections) {
        bodyHtml += `<h2 style="color:#1e293b;margin-top:24px;font-size:16px">${section.title}</h2>`;
        if (section.type === "kpi_summary") {
          bodyHtml += `<div style="background:#f8fafc;border-radius:8px;padding:12px;color:#475569;font-size:13px">KPI section — data source: ${section.dataSource || "N/A"}</div>`;
        } else if (section.type === "table" && section.query) {
          try {
            const result = await query(section.query);
            if (result.rows.length) {
              const headers = Object.keys(result.rows[0]);
              bodyHtml += `<table cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:13px">`;
              bodyHtml += `<thead><tr style="background:#f1f5f9">${headers.map(h => `<th style="text-align:left;font-weight:600;color:#475569;border-bottom:2px solid #e2e8f0">${h}</th>`).join("")}</tr></thead><tbody>`;
              for (const row of result.rows) {
                bodyHtml += `<tr>${Object.values(row).map((v: any) => `<td style="border-bottom:1px solid #f1f5f9;color:#334155">${v ?? ""}</td>`).join("")}</tr>`;
              }
              bodyHtml += `</tbody></table>`;
            } else {
              bodyHtml += `<p style="color:#94a3b8;font-size:13px">No data for this section.</p>`;
            }
          } catch (err) {
            bodyHtml += `<p style="color:#dc2626;font-size:13px">Query failed: ${(err as Error).message}</p>`;
          }
        }
      }
    }

    const customQuery = reportParams.query as string | undefined;
    if (customQuery && !sections) {
      try {
        const result = await query(customQuery);
        if (result.rows.length) {
          bodyHtml += `<table cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:13px">`;
          const headers = Object.keys(result.rows[0]);
          bodyHtml += `<thead><tr style="background:#f1f5f9">${headers.map(h => `<th style="text-align:left;font-weight:600;color:#475569;border-bottom:2px solid #e2e8f0">${h}</th>`).join("")}</tr></thead><tbody>`;
          for (const row of result.rows) {
            bodyHtml += `<tr>${Object.values(row).map((v: any) => `<td style="border-bottom:1px solid #f1f5f9;color:#334155">${v ?? ""}</td>`).join("")}</tr>`;
          }
          bodyHtml += `</tbody></table>`;
        }
      } catch (err) {
        bodyHtml += `<p style="color:#dc2626;font-size:13px">Query failed: ${(err as Error).message}</p>`;
      }
    }

    if (!bodyHtml) bodyHtml = `<p style="color:#94a3b8">No data.</p>`;

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${name}</title></head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:32px;color:#1e293b;max-width:960px;margin:0 auto">
        <div style="border-bottom:3px solid #6366f1;padding-bottom:12px;margin-bottom:24px">
          <h1 style="font-size:22px;font-weight:700;margin:0;color:#6366f1">${name}</h1>
          <p style="color:#94a3b8;font-size:12px;margin-top:4px">Generated ${new Date().toLocaleString()}</p>
        </div>
        ${bodyHtml}
        <hr style="margin-top:40px;border:none;border-top:1px solid #e2e8f0">
        <p style="font-size:11px;color:#94a3b8">Compliance Control Tower — Automated Report</p>
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
          headers.map(h => {
            const val = row[h];
            const str = val == null ? "" : String(val);
            return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
          }).join(",")
        ),
      ];
      return lines.join("\n");
    } catch (err) {
      return `Error: ${(err as Error).message}`;
    }
  }

  async computeNextRun(cron: string): Promise<string | null> {
    try {
      const parser = await import("cron-parser");
      const interval = parser.parseExpression(cron);
      return interval.next().toISOString();
    } catch {
      return null;
    }
  }
}

export const reportingEngine = new ReportingEngine();
