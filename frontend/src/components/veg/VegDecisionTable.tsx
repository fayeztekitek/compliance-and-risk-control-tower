import type { VegDashboardDealRow } from "../../api/veg.api";
import { ShieldAlert, Shield, ShieldCheck } from "lucide-react";

const RISK_BADGE: Record<string, string> = {
  High: "bg-red-100 text-red-700 border-red-200",
  Medium: "bg-orange-100 text-orange-700 border-orange-200",
  Low: "bg-green-100 text-green-700 border-green-200",
};

const DECISION_COLORS: Record<string, string> = {
  "GO FINAL": "bg-green-100 text-green-700",
  "GO INITIAL": "bg-blue-100 text-blue-700",
  BID: "bg-yellow-100 text-yellow-700",
  "No GO": "bg-red-100 text-red-700",
  "NO GO": "bg-red-100 text-red-700",
  Differed: "bg-orange-100 text-orange-700",
  Postponed: "bg-purple-100 text-purple-700",
};

function fmtK(num: number) {
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "M";
  return new Intl.NumberFormat("en-US").format(Math.round(num)) + "K";
}

export default function VegDecisionTable({ rows }: { rows: VegDashboardDealRow[] }) {
  const display = rows.slice(0, 50);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-900">COMEX Decision View</h3>
        <p className="text-xs text-slate-400 mt-0.5">{rows.length} opportunities</p>
      </div>
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr>
              {["VEG ID", "Client", "CRM", "Owner", "Region", "BL", "Product", "Type", "Date", "Decision", "TCV K€", "Workload MD", "Sales", "Closing", "Chronos", "Risk"].map(h => (
                <th key={h} className="px-3 py-2 text-left font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {display.map((row, i) => (
              <tr key={row.veg_id + i} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2 font-mono text-indigo-600 whitespace-nowrap">{row.veg_id}</td>
                <td className="px-3 py-2 font-medium text-slate-900 whitespace-nowrap">{row.client}</td>
                <td className="px-3 py-2 text-slate-600 max-w-[140px] truncate">{row.opportunity_crm || "—"}</td>
                <td className="px-3 py-2 whitespace-nowrap">{row.business_owner}</td>
                <td className="px-3 py-2 whitespace-nowrap">{row.region}</td>
                <td className="px-3 py-2 whitespace-nowrap">{row.business_line}</td>
                <td className="px-3 py-2 max-w-[120px] truncate">{row.products}</td>
                <td className="px-3 py-2 whitespace-nowrap">{row.committee_type}</td>
                <td className="px-3 py-2 whitespace-nowrap text-slate-500">{row.veg_date?.slice(0,10)}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${DECISION_COLORS[row.decision] || "bg-slate-100 text-slate-700"}`}>{row.decision}</span>
                </td>
                <td className="px-3 py-2 font-mono text-right">{fmtK(row.tcv)}</td>
                <td className="px-3 py-2 font-mono text-right">{Math.round(row.total_workload_md)}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${row.sales_status === "Won" ? "bg-green-100 text-green-700" : row.sales_status === "Lost" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>{row.sales_status || "—"}</span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-slate-500">{row.closing_date?.slice(0,10) || "—"}</td>
                <td className="px-3 py-2 max-w-[120px] truncate">{row.project_name_chronos || "—"}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${RISK_BADGE[row.governance_risk_level] || "bg-slate-100 text-slate-700"}`}>
                    {row.governance_risk_level === "High" ? <ShieldAlert className="w-3 h-3" /> : row.governance_risk_level === "Medium" ? <Shield className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                    {row.governance_risk_level}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
