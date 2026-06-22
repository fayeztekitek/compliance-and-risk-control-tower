import { dashboardService } from "./dashboard.service.js";

export const exportService = {
  async exportCsv(dataset: string, filters?: any): Promise<string> {
    const exec = await dashboardService.getExecutiveDashboard();

    let rows: Record<string, any>[] = [];
    let headers: string[] = [];

    switch (dataset) {
      case "vulnerabilities": {
        const { unifiedFindingRepo } = await import("../repositories/unifiedFinding.repo.js");
        const vulns = await unifiedFindingRepo.listFindings({ page: 1, limit: 10000, ...filters });
        headers = ["ID", "Source Tool", "Severity", "CVSS", "CVE", "Component", "Status", "Age (days)"];
        rows = vulns.data.map((v: any) => ({
          ID: v.id,
          "Source Tool": v.sourceTool,
          Severity: v.unifiedSeverity,
          CVSS: v.cvssScore ?? "",
          CVE: v.cveId ?? "",
          Component: v.componentName ?? "",
          Status: v.status,
          "Age (days)": v.ageInDays ?? "",
        }));
        break;
      }
      case "kpis": {
        headers = ["KPI", "Value"];
        rows = Object.entries(exec.kpis).map(([k, v]) => ({ KPI: k, Value: String(v) }));
        break;
      }
      case "kris": {
        headers = ["KRI Name", "Value", "Threshold", "Status"];
        rows = exec.kris.map((k: any) => ({
          "KRI Name": k.name,
          Value: k.value,
          Threshold: k.threshold,
          Status: k.status,
        }));
        break;
      }
      case "projects": {
        const { projectRepo } = await import("../repositories/project.repo.js");
        const projects = await projectRepo.list({ page: 1, limit: 10000, ...filters });
        headers = ["Name", "Code", "Status", "Manager", "Initial Budget", "Consumed Budget"];
        rows = (Array.isArray(projects.data) ? projects.data : []).map((p: any) => ({
          Name: p.name,
          Code: p.code,
          Status: p.status,
          Manager: p.manager,
          "Initial Budget": p.initialBudget,
          "Consumed Budget": p.consumedBudget,
        }));
        break;
      }
      default: {
        headers = ["Dataset", "Available"];
        rows = [{ Dataset: dataset, Available: "No" }];
      }
    }

    const csvLines = [headers.join(",")];
    for (const row of rows) {
      csvLines.push(headers.map(h => {
        const val = row[h];
        if (val == null) return "";
        const str = String(val);
        return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(","));
    }
    return csvLines.join("\n");
  },

  async exportPdf(dataset: string): Promise<Buffer> {
    const csv = await this.exportCsv(dataset);
    const lines = csv.split("\n");
    let html = `<html><head><meta charset="utf-8"><style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      h1 { color: #1e293b; }
      table { border-collapse: collapse; width: 100%; margin-top: 10px; }
      th, td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; font-size: 12px; }
      th { background: #1e293b; color: white; }
      tr:nth-child(even) { background: #f8fafc; }
    </style></head><body>
    <h1>Compliance & Risk Control Tower — ${dataset.toUpperCase()} Report</h1>
    <p>Generated: ${new Date().toISOString()}</p>
    <table><thead><tr>`;

    const headers = lines[0].split(",");
    for (const h of headers) html += `<th>${h}</th>`;
    html += "</tr></thead><tbody>";

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const cells = lines[i].split(",");
      html += "<tr>";
      for (const c of cells) html += `<td>${c}</td>`;
      html += "</tr>";
    }

    html += "</tbody></table></body></html>";
    return Buffer.from(html);
  },
};
