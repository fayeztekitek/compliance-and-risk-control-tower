import { X, Building2, Activity, ShieldAlert, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { OrgDrilldownData } from "../../types/nexus";

interface Props {
  data: OrgDrilldownData;
  onClose: () => void;
}

function StatBox({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-slate-50 rounded-lg px-3 py-2">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className={`text-lg font-bold ${color || "text-slate-800"}`}>{typeof value === "number" ? value.toLocaleString() : value}</p>
    </div>
  );
}

function Pill({ label, value, bg }: { label: string; value: number; bg: string }) {
  return (
    <div className={`${bg} rounded-lg px-3 py-2 text-center min-w-[80px]`}>
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-[10px] text-white/80 font-medium">{label}</p>
    </div>
  );
}

export function OrganizationDrilldown({ data, onClose }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">{data.organizationName}</h3>
            <p className="text-xs text-slate-400">Organization Drill-down Dashboard</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors">
          <X className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          <StatBox label="Sub-Organizations" value={data.directSubOrganizationCount} />
          <StatBox label="Total Applications" value={data.totalApplications} />
          <StatBox label="Scanned" value={data.scannedApplications} color="text-green-600" />
          <StatBox label="Never Scanned" value={data.neverScanned} color={data.neverScanned > 0 ? "text-red-600" : undefined} />
          <StatBox label="Active" value={data.activeApplications} color="text-green-600" />
          <StatBox label="Inactive" value={data.inactiveApplications} color={data.inactiveApplications > 0 ? "text-orange-600" : undefined} />
          <StatBox label="Scan Reports" value={data.totalScanReports} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Pill label="Critical" value={data.openCritical} bg="bg-red-500" />
          <Pill label="High" value={data.openHigh} bg="bg-orange-500" />
          <Pill label="Medium" value={data.openMedium} bg="bg-amber-500" />
          <Pill label="Low" value={data.openLow} bg="bg-slate-400" />
          <Pill label="Waived" value={data.waiveVulnerabilities} bg="bg-blue-500" />
          <Pill label="Accepted" value={data.acceptedRisks} bg="bg-purple-500" />
          <Pill label="Resolved" value={data.resolvedVulnerabilities} bg="bg-green-600" />
          <div className="bg-slate-200 rounded-lg px-3 py-2 text-center min-w-[80px]">
            <p className="text-lg font-bold text-slate-700">{data.applicationsOutOfSla}</p>
            <p className="text-[10px] text-slate-500 font-medium">Out of SLA</p>
          </div>
        </div>

        {data.topRiskyApplications.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Top Risky Applications
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Application</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-slate-500">Open Vulns</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-red-500">Critical</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-orange-500">High</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-slate-500">Risk Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.topRiskyApplications.map((app, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-medium text-slate-700">{app.applicationName}</td>
                      <td className="px-3 py-2 text-right font-mono text-xs">{app.totalOpen}</td>
                      <td className="px-3 py-2 text-right font-mono text-xs text-red-600">{app.criticalCount}</td>
                      <td className="px-3 py-2 text-right font-mono text-xs text-orange-600">{app.highCount}</td>
                      <td className="px-3 py-2 text-right font-mono text-xs">{app.riskScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {data.latestScanReports.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-500" /> Latest Scan Reports
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Application</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-slate-500">Scan Date</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-red-500">C</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-orange-500">H</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-amber-500">M</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-slate-400">L</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.latestScanReports.map((s, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-medium text-slate-700">{s.applicationName}</td>
                      <td className="px-3 py-2 text-right font-mono text-xs text-slate-600">{new Date(s.lastScanDate).toLocaleDateString()}</td>
                      <td className="px-3 py-2 text-right font-mono text-xs text-red-600">{s.openCritical}</td>
                      <td className="px-3 py-2 text-right font-mono text-xs text-orange-600">{s.openHigh}</td>
                      <td className="px-3 py-2 text-right font-mono text-xs text-amber-600">{s.openMedium}</td>
                      <td className="px-3 py-2 text-right font-mono text-xs text-slate-500">{s.openLow}</td>
                      <td className="px-3 py-2 text-right">
                        <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${
                          s.status === "PASS" ? "bg-green-100 text-green-700" :
                          s.status === "FAIL" ? "bg-red-100 text-red-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>{s.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
