import { LatestScanRow } from "../../types/nexus";

interface Props {
  data: LatestScanRow[];
}

function RiskBadge({ score }: { score: number }) {
  if (score >= 20) return <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">High</span>;
  if (score >= 10) return <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Medium</span>;
  if (score > 0) return <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">Low</span>;
  return <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">None</span>;
}

export function LatestScansTable({ data }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">Latest Scans</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500">Application</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500">Organization</th>
              <th className="px-3 py-2.5 text-right text-xs font-medium text-slate-500">Last Scan</th>
              <th className="px-3 py-2.5 text-right text-xs font-medium text-slate-500">Reports</th>
              <th className="px-3 py-2.5 text-right text-xs font-medium text-red-500">Crit</th>
              <th className="px-3 py-2.5 text-right text-xs font-medium text-orange-500">High</th>
              <th className="px-3 py-2.5 text-right text-xs font-medium text-amber-500">Med</th>
              <th className="px-3 py-2.5 text-right text-xs font-medium text-blue-500">Low</th>
              <th className="px-3 py-2.5 text-right text-xs font-medium text-purple-500">Waived / Accepted</th>
              <th className="px-3 py-2.5 text-right text-xs font-medium text-slate-500">Risk Score</th>
              <th className="px-3 py-2.5 text-right text-xs font-medium text-slate-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="px-3 py-2.5 font-medium text-slate-700 whitespace-nowrap">{row.applicationName}</td>
                <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">{row.organizationName}</td>
                <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-600 whitespace-nowrap">
                  {new Date(row.lastScanDate).toLocaleDateString()}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-700">{row.scanReportCount}</td>
                <td className="px-3 py-2.5 text-right font-mono text-xs text-red-600">{row.openCritical}</td>
                <td className="px-3 py-2.5 text-right font-mono text-xs text-orange-600">{row.openHigh}</td>
                <td className="px-3 py-2.5 text-right font-mono text-xs text-amber-600">{row.openMedium}</td>
                <td className="px-3 py-2.5 text-right font-mono text-xs text-blue-500">{row.openLow}</td>
                <td className="px-3 py-2.5 text-right font-mono text-xs text-purple-600">{row.waivedCount + row.acceptedRisks}</td>
                <td className="px-3 py-2.5 text-right"><RiskBadge score={row.riskScore} /></td>
                <td className="px-3 py-2.5 text-right">
                  <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                    row.status === "PASS" ? "bg-green-100 text-green-700" :
                    row.status === "FAIL" ? "bg-red-100 text-red-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>{row.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
