import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import type { VegDashboardGovernanceQuality } from "../../api/veg.api";

function fmtPercent(v: string, total: string) {
  const pct = total !== "0" ? (parseFloat(v) / parseFloat(total) * 100) : 0;
  return pct.toFixed(1) + "%";
}

interface QualityItemProps {
  label: string;
  count: string;
  total: string;
  good: boolean;
}

function QualityBar({ label, count, total, good }: QualityItemProps) {
  const pct = total !== "0" ? (parseFloat(count) / parseFloat(total) * 100) : 0;
  const barPct = good ? 100 - pct : pct;
  return (
    <div className="flex items-center gap-3 py-1.5">
      {good ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> : pct > 50 ? <XCircle className="w-4 h-4 text-red-500 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />}
      <span className="text-xs text-slate-600 w-36 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${good ? "bg-green-500" : pct > 50 ? "bg-red-500" : "bg-orange-500"}`} style={{ width: `${Math.min(barPct, 100)}%` }} />
      </div>
      <span className={`text-xs font-mono w-20 text-right ${good ? "text-green-600" : pct > 50 ? "text-red-600" : "text-orange-600"}`}>
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

export default function VegGovernanceQuality({ quality, total }: { quality: VegDashboardGovernanceQuality; total: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <h3 className="font-semibold text-slate-900 mb-1">Governance Quality</h3>
      <p className="text-xs text-slate-400 mb-4">Completeness rate: {quality.total !== "0" ? ((parseFloat(total) - parseFloat(quality.missing_minutes) - parseFloat(quality.missing_financials) - parseFloat(quality.missing_templates) - parseFloat(quality.missing_crm) - parseFloat(quality.missing_chronos) - parseFloat(quality.missing_closing_date)) / parseFloat(total) * 100).toFixed(0) : 0}%</p>
      <div className="space-y-0.5">
        <QualityBar label="Missing CRM" count={quality.missing_crm} total={quality.total} good={false} />
        <QualityBar label="Missing Identifier" count={quality.missing_identifier} total={quality.total} good={false} />
        <QualityBar label="Missing Templates" count={quality.missing_templates} total={quality.total} good={false} />
        <QualityBar label="Missing Minutes" count={quality.missing_minutes} total={quality.total} good={false} />
        <QualityBar label="Missing Financials" count={quality.missing_financials} total={quality.total} good={false} />
        <QualityBar label="Missing Chronos" count={quality.missing_chronos} total={quality.total} good={false} />
        <QualityBar label="Missing Closing Date" count={quality.missing_closing_date} total={quality.total} good={false} />
        <QualityBar label="Duplicates" count={quality.duplicate_yes} total={quality.total} good={false} />
        <QualityBar label="ID Check Issues" count={quality.id_check_issues} total={quality.total} good={false} />
        <QualityBar label="CRM Delta Issues" count={quality.delta_crm_issues} total={quality.total} good={false} />
        <QualityBar label="Chronos Delta Issues" count={quality.delta_chronos_issues} total={quality.total} good={false} />
      </div>
    </div>
  );
}
