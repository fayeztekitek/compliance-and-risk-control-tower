import { ChevronLeft, Briefcase, DollarSign, Activity, BarChart3, Clock, FileText, ExternalLink } from "lucide-react";
import { DecisionBadge, SalesBadge } from "../ui/Badge";
import { fmtNum, fmtK } from "../../utils/veg";
import type { VegDeal } from "../../types/veg";

interface Props {
  detail: VegDeal;
  onBack: () => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
}

export default function VegDetailView({ detail, onBack, onEdit, onDelete }: Props) {
  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ChevronLeft className="w-4 h-4" /> Back to list
      </button>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-xs text-slate-400">{detail.veg_id}</span>
              <DecisionBadge decision={detail.decision} />
              <SalesBadge status={detail.sales_status} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">{detail.client}</h2>
            <p className="text-sm text-slate-500 mt-1">
              {detail.business_line} · {detail.region} · {detail.committee_type} · {new Date(detail.veg_date).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={onEdit} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50">Edit</button>
            <button onClick={() => onDelete(detail.id)} className="px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50">Delete</button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-sm"><Briefcase className="w-4 h-4 text-indigo-400" /><span className="text-slate-600">Owner: <strong>{detail.business_owner}</strong></span></div>
          <div className="flex items-center gap-2 text-sm"><DollarSign className="w-4 h-4 text-green-500" /><span className="text-slate-600">TCV: <strong>{fmtK(detail.tcv)}</strong></span></div>
          <div className="flex items-center gap-2 text-sm"><Activity className="w-4 h-4 text-blue-500" /><span className="text-slate-600">PS: <strong>{fmtK(detail.ps)}</strong> / {fmtNum(detail.wl_ps_md)}md</span></div>
          <div className="flex items-center gap-2 text-sm"><BarChart3 className="w-4 h-4 text-orange-500" /><span className="text-slate-600">IP&M: <strong>{fmtK(detail.ip_maintenance)}</strong></span></div>
          {detail.invst_start_date ? <div className="flex items-center gap-2 text-sm"><Clock className="w-4 h-4 text-purple-500" /><span className="text-slate-600">Inv. Start: <strong>{new Date(detail.invst_start_date).toLocaleDateString()}</strong></span></div> : null}
        </div>

        <h3 className="text-base font-semibold text-slate-700 mt-6 mb-3">Financial Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "TCV", value: fmtK(detail.tcv) },
            { label: "IP + Maintenance", value: fmtK(detail.ip_maintenance) },
            { label: "SaaS", value: fmtK(detail.saas) },
            { label: "PS", value: fmtK(detail.ps) },
          ].map(s => (
            <div key={s.label} className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="text-lg font-bold text-slate-800">{s.value}</p>
            </div>
          ))}
        </div>

        {(detail.tcv_crm > 0 || detail.delta_veg_crm !== 0) && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-amber-50 rounded-lg p-3">
              <p className="text-xs text-amber-600">TCV CRM</p>
              <p className="text-lg font-bold text-slate-800">{fmtK(detail.tcv_crm)}</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3">
              <p className="text-xs text-amber-600">Delta VEG/CRM</p>
              <p className="text-lg font-bold text-slate-800">{fmtK(detail.delta_veg_crm)}</p>
            </div>
            {detail.duration_days ? (
              <div className="bg-amber-50 rounded-lg p-3">
                <p className="text-xs text-amber-600">Duration</p>
                <p className="text-lg font-bold text-slate-800">{detail.duration_days} days</p>
              </div>
            ) : null}
          </div>
        )}

        {(detail.financials_url || detail.templates_url) && (
          <div className="flex gap-3 mt-4">
            {detail.financials_url && (
              <a href={detail.financials_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800">
                <FileText className="w-4 h-4" /> Financial Simulator <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {detail.templates_url && (
              <a href={detail.templates_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800">
                <FileText className="w-4 h-4" /> GNG Template <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {detail.minutes && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2"><FileText className="w-4 h-4" /> Minutes</h4>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{detail.minutes}</p>
          </div>
        )}

        {detail.comments && (
          <div className="mt-3 p-3 bg-slate-50 rounded-lg">
            <h4 className="text-xs font-medium text-slate-500 mb-1">Comments</h4>
            <p className="text-sm text-slate-600">{detail.comments}</p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {detail.account_type && <div className="text-sm"><span className="text-slate-500">Account:</span> <strong>{detail.account_type}</strong></div>}
          {detail.deal_type && detail.deal_type !== "NA" && <div className="text-sm"><span className="text-slate-500">Deal Type:</span> <strong>{detail.deal_type}</strong></div>}
          {detail.closing_date && <div className="text-sm"><span className="text-slate-500">Closing:</span> <strong>{new Date(detail.closing_date).toLocaleDateString()}</strong></div>}
          {detail.project_name_chronos && <div className="text-sm"><span className="text-slate-500">Chronos:</span> <strong>{detail.project_name_chronos}</strong></div>}
        </div>

        {(detail.chronos_wl_md > 0 || detail.turnover_chronos > 0) && (
          <div className="mt-4 p-3 bg-slate-50 rounded-lg">
            <h4 className="text-xs font-medium text-slate-500 mb-2">Chronos Tracking</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div><span className="text-slate-500">WL:</span> {fmtNum(detail.chronos_wl_md)} md</div>
              <div><span className="text-slate-500">Turnover:</span> {fmtK(detail.turnover_chronos)}</div>
              {detail.delta_veg_chronos_md !== 0 && <div><span className="text-slate-500">Delta:</span> {fmtNum(detail.delta_veg_chronos_md)} md</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
